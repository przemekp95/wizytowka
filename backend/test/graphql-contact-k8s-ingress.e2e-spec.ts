import {
  execFileSync,
  spawn,
  spawnSync,
  type ChildProcessByStdio,
  type ChildProcessWithoutNullStreams,
} from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import request from 'supertest';

type PortForwardHandle = {
  localPort: number;
  stop: () => Promise<void>;
};

type HarnessImageHandle = {
  imageRef: string;
  cleanup: () => Promise<void>;
};

type ClusterLoader =
  | { provider: 'k3d'; clusterName: string }
  | { provider: 'kind'; clusterName: string }
  | { provider: 'minikube'; clusterName: string };

const THROTTLE_LIMIT = 30;
const ingressKubeconfig = process.env.K8S_INGRESS_KUBECONFIG;
const ingressIt = ingressKubeconfig ? it : it.skip;

jest.setTimeout(600_000);

describe('GraphQL Contact shared throttling through Kubernetes ingress (e2e)', () => {
  let portForward: PortForwardHandle | undefined;
  let harnessImage: HarnessImageHandle | undefined;
  const tempPaths: string[] = [];

  function execCommand(command: string, args: string[]): string {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }

  function kubectlArgs(args: string[]): string[] {
    const baseArgs = ['--kubeconfig', ingressKubeconfig!];

    if (process.env.K8S_INGRESS_CONTEXT) {
      baseArgs.push('--context', process.env.K8S_INGRESS_CONTEXT);
    }

    return [...baseArgs, ...args];
  }

  function kubectl(args: string[]): string {
    return execCommand('kubectl', kubectlArgs(args));
  }

  function canUseDocker(): boolean {
    return (
      spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
        encoding: 'utf8',
      }).status === 0
    );
  }

  function commandAvailable(command: string): boolean {
    return (
      spawnSync(command, ['--help'], {
        stdio: 'ignore',
      }).status === 0
    );
  }

  function getCurrentContext(): string {
    return kubectl(['config', 'current-context']);
  }

  function detectClusterLoader(): ClusterLoader | null {
    const explicitProvider = process.env.K8S_INGRESS_CLUSTER_PROVIDER;
    const explicitClusterName = process.env.K8S_INGRESS_CLUSTER_NAME;

    if (explicitProvider && explicitClusterName) {
      if (
        explicitProvider === 'k3d' ||
        explicitProvider === 'kind' ||
        explicitProvider === 'minikube'
      ) {
        return {
          provider: explicitProvider,
          clusterName: explicitClusterName,
        };
      }

      throw new Error(
        `Unsupported K8S_INGRESS_CLUSTER_PROVIDER: ${explicitProvider}`,
      );
    }

    const context = getCurrentContext();

    if (context.startsWith('k3d-')) {
      return {
        provider: 'k3d',
        clusterName: context.slice('k3d-'.length),
      };
    }

    if (context.startsWith('kind-')) {
      return {
        provider: 'kind',
        clusterName: context.slice('kind-'.length),
      };
    }

    if (context === 'minikube' || context.startsWith('minikube-')) {
      return {
        provider: 'minikube',
        clusterName:
          process.env.K8S_INGRESS_CLUSTER_NAME ??
          context.replace(/^minikube-?/, '') ??
          'minikube',
      };
    }

    return null;
  }

  function loadHarnessImage(loader: ClusterLoader, imageRef: string): void {
    if (loader.provider === 'k3d') {
      const nodeNames = execCommand('docker', ['ps', '--format', '{{.Names}}'])
        .split('\n')
        .map((value) => value.trim())
        .filter(
          (value) =>
            value.startsWith(`k3d-${loader.clusterName}-`) &&
            /(server|agent)-\d+$/.test(value),
        );

      if (nodeNames.length === 0) {
        throw new Error(
          `Unable to find k3d nodes for cluster ${loader.clusterName}`,
        );
      }

      const tarPath = join(
        tmpdir(),
        `wizytowka-throttle-harness-${randomUUID()}.tar`,
      );
      const containerTarPath = `/tmp/throttle-harness-${randomUUID()}.tar`;

      try {
        execCommand('docker', ['save', '--output', tarPath, imageRef]);

        for (const nodeName of nodeNames) {
          execCommand('docker', [
            'cp',
            tarPath,
            `${nodeName}:${containerTarPath}`,
          ]);
          execCommand('docker', [
            'exec',
            nodeName,
            'ctr',
            '-n',
            'k8s.io',
            'images',
            'import',
            containerTarPath,
          ]);
          execCommand('docker', [
            'exec',
            nodeName,
            'rm',
            '-f',
            containerTarPath,
          ]);
        }
      } finally {
        spawnSync('rm', ['-f', tarPath], {
          stdio: 'ignore',
        });
      }

      return;
    }

    if (loader.provider === 'kind') {
      if (!commandAvailable('kind')) {
        throw new Error(
          'kind is required to load the local throttle harness image into this cluster',
        );
      }

      execCommand('kind', [
        'load',
        'docker-image',
        imageRef,
        '--name',
        loader.clusterName,
      ]);
      return;
    }

    if (!commandAvailable('minikube')) {
      throw new Error(
        'minikube is required to load the local throttle harness image into this cluster',
      );
    }

    execCommand('minikube', [
      'image',
      'load',
      imageRef,
      '-p',
      loader.clusterName || 'minikube',
    ]);
  }

  function prepareHarnessImage(): HarnessImageHandle {
    const explicitImage = process.env.K8S_INGRESS_IMAGE;

    if (explicitImage && explicitImage.trim() !== '') {
      return {
        imageRef: explicitImage,
        cleanup: async () => undefined,
      };
    }

    if (!canUseDocker()) {
      throw new Error(
        'Docker is required to build the throttle harness image. Alternatively set K8S_INGRESS_IMAGE to a pullable image.',
      );
    }

    const loader = detectClusterLoader();

    if (!loader) {
      throw new Error(
        'Unable to detect a supported local cluster loader. Set K8S_INGRESS_IMAGE or provide K8S_INGRESS_CLUSTER_PROVIDER and K8S_INGRESS_CLUSTER_NAME.',
      );
    }

    const imageRef = `wizytowka-throttle-harness:test-${randomUUID().slice(0, 12)}`;
    execCommand('docker', [
      'build',
      '--file',
      'Dockerfile.throttle-harness',
      '--tag',
      imageRef,
      '..',
    ]);
    loadHarnessImage(loader, imageRef);

    return {
      imageRef,
      cleanup: async () => {
        spawnSync('docker', ['image', 'rm', '-f', imageRef], {
          stdio: 'ignore',
        });
      },
    };
  }

  async function getFreePort(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const server = createNetServer();

      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();

        if (!address || typeof address === 'string') {
          reject(new Error('Unable to allocate a free TCP port'));
          return;
        }

        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(address.port);
        });
      });
    });
  }

  async function startPortForward(
    namespace: string,
    serviceName: string,
    remotePort: string,
  ): Promise<PortForwardHandle> {
    const localPort = await getFreePort();
    const child = spawn(
      'kubectl',
      kubectlArgs([
        '--namespace',
        namespace,
        'port-forward',
        `service/${serviceName}`,
        `${localPort}:${remotePort}`,
      ]),
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let output = '';

    await new Promise<void>((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        output += chunk.toString('utf8');

        if (output.includes(`Forwarding from 127.0.0.1:${localPort}`)) {
          cleanup();
          resolve();
        }
      };
      const onExit = (code: number | null) => {
        cleanup();
        reject(
          new Error(
            `kubectl port-forward exited before becoming ready (code: ${
              code ?? 'unknown'
            })\n${output}`,
          ),
        );
      };
      const cleanup = () => {
        child.stdout.off('data', onData);
        child.stderr.off('data', onData);
        child.off('exit', onExit);
      };

      child.stdout.on('data', onData);
      child.stderr.on('data', onData);
      child.once('exit', onExit);
    });

    return {
      localPort,
      async stop() {
        await stopPortForward(child);
      },
    };
  }

  async function stopPortForward(
    child: ChildProcessByStdio<null, NodeJS.ReadableStream, NodeJS.ReadableStream>,
  ): Promise<void> {
    if (child.killed) {
      return;
    }

    child.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
      }, 5_000);

      child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  async function waitForIngress(
    origin: string,
    hostHeader: string,
  ): Promise<void> {
    for (let attempt = 0; attempt < 90; attempt++) {
      try {
        const response = await request(origin)
          .get('/api/health/live')
          .set('host', hostHeader);

        if (response.status === 200) {
          return;
        }
      } catch {
        // The ingress route is still warming up.
      }

      await delay(1_000);
    }

    throw new Error(
      `Kubernetes ingress route did not become ready at ${origin} for host ${hostHeader}`,
    );
  }

  afterAll(async () => {
    if (portForward) {
      await portForward.stop().catch(() => undefined);
    }

    if (harnessImage) {
      await harnessImage.cleanup().catch(() => undefined);
    }

    for (const tempPath of tempPaths.reverse()) {
      await rm(tempPath, { recursive: true, force: true }).catch(
        () => undefined,
      );
    }
  });

  ingressIt(
    'enforces the shared limit through a Kubernetes ingress controller',
    async () => {
      expect(ingressKubeconfig).toBeDefined();
      harnessImage ??= prepareHarnessImage();

      const ingressClassName = process.env.K8S_INGRESS_CLASS_NAME ?? 'traefik';
      const ingressControllerNamespace =
        process.env.K8S_INGRESS_CONTROLLER_NAMESPACE ?? 'kube-system';
      const ingressControllerService =
        process.env.K8S_INGRESS_CONTROLLER_SERVICE ?? 'traefik';
      const ingressControllerPort =
        process.env.K8S_INGRESS_CONTROLLER_PORT ?? '80';
      const namespace = `throttle-${randomUUID().slice(0, 8)}`;
      const serviceName = 'throttle-harness';
      const headlessServiceName = `${serviceName}-headless`;
      const replicaServiceA = `${serviceName}-0`;
      const replicaServiceB = `${serviceName}-1`;
      const mongoServiceName = 'mongo';
      const ingressHostA = `throttle-a-${randomUUID().slice(0, 8)}.local`;
      const ingressHostB = `throttle-b-${randomUUID().slice(0, 8)}.local`;
      const mongoDbName = `throttle-${randomUUID().slice(0, 8)}`;
      const tempDir = await mkdtemp(join(tmpdir(), 'wizytowka-k8s-ingress-'));
      const manifestPath = join(tempDir, 'ingress.yaml');

      tempPaths.push(tempDir);

      try {
        await writeFile(
          manifestPath,
          `
apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${mongoServiceName}
  namespace: ${namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${mongoServiceName}
  template:
    metadata:
      labels:
        app: ${mongoServiceName}
    spec:
      containers:
        - name: mongo
          image: mongo:7
          args:
            - --bind_ip_all
          ports:
            - containerPort: 27017
          readinessProbe:
            tcpSocket:
              port: 27017
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ${mongoServiceName}
  namespace: ${namespace}
spec:
  selector:
    app: ${mongoServiceName}
  ports:
    - name: mongo
      port: 27017
      targetPort: 27017
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${serviceName}
  namespace: ${namespace}
spec:
  serviceName: ${headlessServiceName}
  replicas: 2
  selector:
    matchLabels:
      app: ${serviceName}
  template:
    metadata:
      labels:
        app: ${serviceName}
    spec:
      containers:
        - name: harness
          image: ${harnessImage.imageRef}
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 4000
              name: http
          env:
            - name: PORT
              value: "4000"
            - name: TRUST_PROXY
              value: "true"
            - name: THROTTLE_STORAGE
              value: "mongo"
            - name: MONGODB_URI
              value: mongodb://${mongoServiceName}.${namespace}.svc.cluster.local:27017
            - name: MONGODB_DB
              value: ${mongoDbName}
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          readinessProbe:
            httpGet:
              path: /api/health/live
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ${headlessServiceName}
  namespace: ${namespace}
spec:
  clusterIP: None
  selector:
    app: ${serviceName}
  ports:
    - name: http
      port: 4000
      targetPort: http
---
apiVersion: v1
kind: Service
metadata:
  name: ${replicaServiceA}
  namespace: ${namespace}
spec:
  selector:
    app: ${serviceName}
    statefulset.kubernetes.io/pod-name: ${serviceName}-0
  ports:
    - name: http
      port: 4000
      targetPort: http
---
apiVersion: v1
kind: Service
metadata:
  name: ${replicaServiceB}
  namespace: ${namespace}
spec:
  selector:
    app: ${serviceName}
    statefulset.kubernetes.io/pod-name: ${serviceName}-1
  ports:
    - name: http
      port: 4000
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${serviceName}
  namespace: ${namespace}
spec:
  ingressClassName: ${ingressClassName}
  rules:
    - host: ${ingressHostA}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${replicaServiceA}
                port:
                  number: 4000
    - host: ${ingressHostB}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${replicaServiceB}
                port:
                  number: 4000
`.trimStart(),
          'utf8',
        );

        kubectl(['apply', '-f', manifestPath]);
        kubectl([
          'wait',
          '--namespace',
          namespace,
          '--for=condition=available',
          `deployment/${mongoServiceName}`,
          '--timeout=300s',
        ]);
        kubectl([
          'rollout',
          'status',
          '--namespace',
          namespace,
          `statefulset/${serviceName}`,
          '--timeout=300s',
        ]);

        portForward = await startPortForward(
          ingressControllerNamespace,
          ingressControllerService,
          ingressControllerPort,
        );

        const origin = `http://127.0.0.1:${portForward.localPort}`;
        await waitForIngress(origin, ingressHostA);
        await waitForIngress(origin, ingressHostB);

        const query = `
            mutation($input: ContactMessageInput!) {
              sendContact(input: $input) { ok error }
            }
          `;
        const variables = {
          input: {
            name: 'Jan Testowy',
            email: 'jan@test.com',
            message: 'To jest poprawna wiadomosc testowa.',
          },
        };
        const hostRoutes = [ingressHostA, ingressHostB] as const;
        const instances = new Map<string, string>();

        for (const hostRoute of hostRoutes) {
          for (let i = 0; i < THROTTLE_LIMIT / 2; i++) {
            const response = await request(origin)
              .post('/graphql')
              .set('host', hostRoute)
              .set('content-type', 'application/json')
              .send({ query, variables });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
              data: {
                sendContact: {
                  ok: true,
                  error: null,
                },
              },
            });

            const instanceId = response.headers['x-harness-instance'];

            if (typeof instanceId === 'string' && instanceId !== '') {
              instances.set(hostRoute, instanceId);
            }
          }
        }

        const throttled = await request(origin)
          .post('/graphql')
          .set('host', ingressHostA)
          .set('content-type', 'application/json')
          .send({ query, variables });

        expect(throttled.status).toBe(429);
        expect(JSON.stringify(throttled.body).toLowerCase()).toMatch(
          /rate|throttle|too many/i,
        );
        expect(instances.size).toBe(2);
        expect(instances.get(ingressHostA)).toBeTruthy();
        expect(instances.get(ingressHostB)).toBeTruthy();
        expect(instances.get(ingressHostA)).not.toBe(
          instances.get(ingressHostB),
        );
      } finally {
        if (portForward) {
          await portForward.stop().catch(() => undefined);
          portForward = undefined;
        }

        try {
          kubectl([
            'delete',
            'namespace',
            namespace,
            '--ignore-not-found=true',
            '--wait=false',
          ]);
        } catch {
          // Best-effort cleanup against the external cluster.
        }
      }
    },
  );
});
