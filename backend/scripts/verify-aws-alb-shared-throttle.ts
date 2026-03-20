import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const THROTTLE_LIMIT = 30;

type GraphQLResponse = {
  status: number;
  body: unknown;
  instanceId: string | null;
};

type HttpResponse = {
  status: number;
  bodyText: string;
  headers: Record<string, string | string[] | undefined>;
};

type ManagedImage = {
  imageRef: string;
  cleanup: () => Promise<void>;
};

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : undefined;
}

function yamlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function execCommand(
  command: string,
  args: string[],
  options?: { input?: string },
): string {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    input: options?.input,
  }).trim();
}

function kubectlArgs(kubeconfigPath: string, args: string[]): string[] {
  const context = optionalEnv('AWS_ALB_CONTEXT');

  return context
    ? ['--kubeconfig', kubeconfigPath, '--context', context, ...args]
    : ['--kubeconfig', kubeconfigPath, ...args];
}

function kubectl(kubeconfigPath: string, args: string[]): string {
  return execCommand('kubectl', kubectlArgs(kubeconfigPath, args));
}

function parseEcrRegion(imageRepository: string): string | undefined {
  const match = imageRepository.match(
    /^[0-9]{12}\.dkr\.ecr\.([a-z0-9-]+)\.amazonaws\.com\//,
  );

  return match?.[1];
}

function parseEcrRepositoryName(imageRepository: string): string | undefined {
  const parts = imageRepository.split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : undefined;
}

async function waitForAlbHostname(
  kubeconfigPath: string,
  namespace: string,
  ingressName: string,
  timeoutSeconds: number,
): Promise<string> {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    const hostname = kubectl(kubeconfigPath, [
      '--namespace',
      namespace,
      'get',
      'ingress',
      ingressName,
      '-o',
      'jsonpath={.status.loadBalancer.ingress[0].hostname}',
    ]);

    if (hostname) {
      return hostname;
    }

    await delay(5000);
  }

  throw new Error(
    `Timed out waiting for ALB hostname on ingress ${namespace}/${ingressName}`,
  );
}

async function waitForTargetHealth(
  region: string,
  loadBalancerName: string,
  timeoutSeconds: number,
): Promise<void> {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let loadBalancerArn = '';

  while (Date.now() < deadline) {
    if (!loadBalancerArn) {
      try {
        loadBalancerArn = execCommand('aws', [
          'elbv2',
          'describe-load-balancers',
          '--region',
          region,
          '--names',
          loadBalancerName,
          '--query',
          'LoadBalancers[0].LoadBalancerArn',
          '--output',
          'text',
        ]);
      } catch {
        await delay(5000);
        continue;
      }
    }

    const targetGroupArn = execCommand('aws', [
      'elbv2',
      'describe-target-groups',
      '--region',
      region,
      '--load-balancer-arn',
      loadBalancerArn,
      '--query',
      'TargetGroups[0].TargetGroupArn',
      '--output',
      'text',
    ]);

    if (!targetGroupArn || targetGroupArn === 'None') {
      await delay(5000);
      continue;
    }

    const healthStates = execCommand('aws', [
      'elbv2',
      'describe-target-health',
      '--region',
      region,
      '--target-group-arn',
      targetGroupArn,
      '--query',
      'TargetHealthDescriptions[].TargetHealth.State',
      '--output',
      'json',
    ]);
    const states = JSON.parse(healthStates) as string[];

    if (states.length >= 2 && states.every((state) => state === 'healthy')) {
      return;
    }

    await delay(5000);
  }

  throw new Error(
    `Timed out waiting for healthy ALB targets on load balancer ${loadBalancerName}`,
  );
}

async function waitForHttpReady(
  origin: string,
  timeoutSeconds: number,
  hostHeader: string,
): Promise<void> {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    try {
      const response = await sendHttpRequest(origin, {
        method: 'GET',
        path: '/api/health/live',
        hostHeader,
      });

      if (response.status === 200) {
        return;
      }
    } catch {
      // The load balancer is still propagating or targets are warming up.
    }

    await delay(5000);
  }

  throw new Error(
    `Timed out waiting for HTTP readiness at ${origin}/api/health/live`,
  );
}

async function sendHttpRequest(
  origin: string,
  options: {
    method: 'GET' | 'POST';
    path: string;
    hostHeader: string;
    body?: string;
  },
): Promise<HttpResponse> {
  const url = new URL(origin);
  const requestImpl = url.protocol === 'https:' ? httpsRequest : httpRequest;

  return new Promise<HttpResponse>((resolve, reject) => {
    const req = requestImpl(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        method: options.method,
        path: options.path,
        headers: {
          host: options.hostHeader,
          ...(options.body
            ? {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(options.body).toString(),
              }
            : {}),
        },
      },
      (res) => {
        let bodyText = '';

        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          bodyText += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            bodyText,
            headers: res.headers,
          });
        });
      },
    );

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function postGraphql(
  origin: string,
  query: string,
  variables: unknown,
  hostHeader: string,
): Promise<GraphQLResponse> {
  const response = await sendHttpRequest(origin, {
    method: 'POST',
    path: '/graphql',
    hostHeader,
    body: JSON.stringify({ query, variables }),
  });
  const body = JSON.parse(response.bodyText) as unknown;
  const instanceHeader = response.headers['x-harness-instance'];

  return {
    status: response.status,
    body,
    instanceId: Array.isArray(instanceHeader)
      ? (instanceHeader[0] ?? null)
      : (instanceHeader ?? null),
  };
}

function inferAwsRegion(imageRepository?: string): string | undefined {
  return (
    optionalEnv('AWS_ALB_REGION') ??
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION ??
    (imageRepository ? parseEcrRegion(imageRepository) : undefined)
  );
}

async function prepareHarnessImage(region: string): Promise<ManagedImage> {
  const explicitImage = optionalEnv('AWS_ALB_IMAGE');

  if (explicitImage) {
    return {
      imageRef: explicitImage,
      cleanup: async () => undefined,
    };
  }

  const imageRepository = env('AWS_ALB_IMAGE_REPOSITORY');
  const imageTag =
    optionalEnv('AWS_ALB_IMAGE_TAG') ?? randomUUID().slice(0, 12);
  const imageRef = `${imageRepository}:${imageTag}`;
  const registry = imageRepository.split('/')[0];
  const repositoryName = parseEcrRepositoryName(imageRepository);

  if (!repositoryName) {
    throw new Error(
      `AWS_ALB_IMAGE_REPOSITORY must include a repository path, got: ${imageRepository}`,
    );
  }

  const loginPassword = execCommand('aws', [
    'ecr',
    'get-login-password',
    '--region',
    region,
  ]);

  execCommand(
    'docker',
    ['login', '--username', 'AWS', '--password-stdin', registry],
    { input: loginPassword },
  );
  execCommand('docker', [
    'build',
    '--file',
    'Dockerfile.throttle-harness',
    '--tag',
    imageRef,
    '..',
  ]);
  execCommand('docker', ['push', imageRef]);

  return {
    imageRef,
    cleanup: async () => {
      if (process.env.AWS_ALB_DELETE_IMAGE !== '0') {
        try {
          execCommand('aws', [
            'ecr',
            'batch-delete-image',
            '--region',
            region,
            '--repository-name',
            repositoryName,
            '--image-ids',
            `imageTag=${imageTag}`,
          ]);
        } catch {
          // Best-effort cleanup for the pushed harness image.
        }
      }

      try {
        execCommand('docker', ['image', 'rm', '-f', imageRef]);
      } catch {
        // Best-effort cleanup for the local builder cache.
      }
    },
  };
}

async function main() {
  const dryRun = process.env.AWS_ALB_DRY_RUN === '1';
  const kubeconfigPath = env('AWS_ALB_KUBECONFIG', process.env.KUBECONFIG);
  const explicitImage = optionalEnv('AWS_ALB_IMAGE');
  const imageRepository = optionalEnv('AWS_ALB_IMAGE_REPOSITORY');
  const region = inferAwsRegion(imageRepository);

  if (!explicitImage && !imageRepository) {
    throw new Error(
      'Set AWS_ALB_IMAGE to an existing image or AWS_ALB_IMAGE_REPOSITORY to build and push the throttle harness image.',
    );
  }

  if (!dryRun && !region) {
    throw new Error(
      'Missing AWS region. Set AWS_ALB_REGION, AWS_REGION, AWS_DEFAULT_REGION, or use an ECR repository with an embedded region.',
    );
  }

  const namespace =
    optionalEnv('AWS_ALB_NAMESPACE') ?? `alb-thr-${randomUUID().slice(0, 8)}`;
  const serviceName = 'throttle-harness';
  const headlessServiceName = `${serviceName}-headless`;
  const replicaServiceA = `${serviceName}-0`;
  const replicaServiceB = `${serviceName}-1`;
  const mongoServiceName = 'mongo';
  const ingressName = 'throttle-harness';
  const loadBalancerName = `thr${randomUUID().replace(/-/g, '').slice(0, 20)}`;
  const mongoDbName = `throttle-${randomUUID().slice(0, 8)}`;
  const albHostA = `alb-a-${randomUUID().slice(0, 8)}.local`;
  const albHostB = `alb-b-${randomUUID().slice(0, 8)}.local`;
  const tempDir = await mkdtemp(join(tmpdir(), 'wizytowka-aws-alb-'));
  const manifestPath = join(tempDir, 'aws-alb-throttle.yaml');
  const originScheme =
    optionalEnv('AWS_ALB_ORIGIN_SCHEME') ??
    (optionalEnv('AWS_ALB_CERTIFICATE_ARN') ? 'https' : 'http');
  const listenPorts =
    optionalEnv('AWS_ALB_LISTEN_PORTS_JSON') ??
    (originScheme === 'https' ? '[{"HTTPS":443}]' : '[{"HTTP":80}]');
  const imagePreview =
    explicitImage ??
    `${
      imageRepository ?? '<missing-image-repository>'
    }:${optionalEnv('AWS_ALB_IMAGE_TAG') ?? '<generated>'}`;
  const image = dryRun
    ? {
        imageRef: imagePreview,
        cleanup: async () => undefined,
      }
    : await prepareHarnessImage(region!);
  const annotationLines = [
    `    alb.ingress.kubernetes.io/load-balancer-name: ${yamlQuote(loadBalancerName)}`,
    `    alb.ingress.kubernetes.io/scheme: ${yamlQuote(
      optionalEnv('AWS_ALB_SCHEME') ?? 'internet-facing',
    )}`,
    `    alb.ingress.kubernetes.io/target-type: ${yamlQuote(
      optionalEnv('AWS_ALB_TARGET_TYPE') ?? 'ip',
    )}`,
    `    alb.ingress.kubernetes.io/healthcheck-path: ${yamlQuote(
      '/api/health/live',
    )}`,
    `    alb.ingress.kubernetes.io/listen-ports: ${yamlQuote(listenPorts)}`,
  ];

  if (optionalEnv('AWS_ALB_SUBNETS')) {
    annotationLines.push(
      `    alb.ingress.kubernetes.io/subnets: ${yamlQuote(
        optionalEnv('AWS_ALB_SUBNETS')!,
      )}`,
    );
  }

  if (optionalEnv('AWS_ALB_SECURITY_GROUPS')) {
    annotationLines.push(
      `    alb.ingress.kubernetes.io/security-groups: ${yamlQuote(
        optionalEnv('AWS_ALB_SECURITY_GROUPS')!,
      )}`,
    );
  }

  if (optionalEnv('AWS_ALB_CERTIFICATE_ARN')) {
    annotationLines.push(
      `    alb.ingress.kubernetes.io/certificate-arn: ${yamlQuote(
        optionalEnv('AWS_ALB_CERTIFICATE_ARN')!,
      )}`,
    );
  }

  if (optionalEnv('AWS_ALB_GROUP_NAME')) {
    annotationLines.push(
      `    alb.ingress.kubernetes.io/group.name: ${yamlQuote(
        optionalEnv('AWS_ALB_GROUP_NAME')!,
      )}`,
    );
  }

  const manifest = `
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
          image: ${image.imageRef}
          imagePullPolicy: Always
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
  name: ${ingressName}
  namespace: ${namespace}
  annotations:
${annotationLines.join('\n')}
spec:
  ingressClassName: ${optionalEnv('AWS_ALB_INGRESS_CLASS') ?? 'alb'}
  rules:
    - host: ${albHostA}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${replicaServiceA}
                port:
                  number: 4000
    - host: ${albHostB}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${replicaServiceB}
                port:
                  number: 4000
`.trimStart();

  await writeFile(manifestPath, manifest, 'utf8');

  if (dryRun) {
    console.log(`AWS ALB manifest written to ${manifestPath}`);
    console.log(`Planned image: ${image.imageRef}`);
    console.log(`Planned namespace: ${namespace}`);
    console.log(`Planned ALB name: ${loadBalancerName}`);
    return;
  }

  try {
    kubectl(kubeconfigPath, ['apply', '-f', manifestPath]);
    kubectl(kubeconfigPath, [
      'wait',
      '--namespace',
      namespace,
      '--for=condition=available',
      `deployment/${mongoServiceName}`,
      '--timeout=300s',
    ]);
    kubectl(kubeconfigPath, [
      'rollout',
      'status',
      '--namespace',
      namespace,
      `statefulset/${serviceName}`,
      '--timeout=300s',
    ]);

    const albHostname = await waitForAlbHostname(
      kubeconfigPath,
      namespace,
      ingressName,
      Number(optionalEnv('AWS_ALB_WAIT_SECONDS') ?? '900'),
    );

    await waitForTargetHealth(
      region!,
      loadBalancerName,
      Number(optionalEnv('AWS_ALB_WAIT_SECONDS') ?? '900'),
    );

    const origin = `${originScheme}://${albHostname}`;
    await waitForHttpReady(
      origin,
      Number(optionalEnv('AWS_ALB_HTTP_READY_SECONDS') ?? '300'),
      albHostA,
    );
    await waitForHttpReady(
      origin,
      Number(optionalEnv('AWS_ALB_HTTP_READY_SECONDS') ?? '300'),
      albHostB,
    );

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
    const hosts = [albHostA, albHostB] as const;
    const instances = new Map<string, string>();

    for (const host of hosts) {
      for (let i = 0; i < THROTTLE_LIMIT / 2; i++) {
        const response = await postGraphql(origin, query, variables, host);

        if (response.status !== 200) {
          throw new Error(
            `Expected HTTP 200 before throttling, got ${response.status}: ${JSON.stringify(
              response.body,
            )}`,
          );
        }

        if (response.instanceId) {
          instances.set(host, response.instanceId);
        }
      }
    }

    const throttled = await postGraphql(origin, query, variables, albHostA);

    if (throttled.status !== 429) {
      throw new Error(
        `Expected HTTP 429 on throttled request, got ${throttled.status}: ${JSON.stringify(
          throttled.body,
        )}`,
      );
    }

    if (
      !/rate|throttle|too many/i.test(
        JSON.stringify(throttled.body).toLowerCase(),
      )
    ) {
      throw new Error(
        `Throttled response body did not contain a rate-limit error: ${JSON.stringify(
          throttled.body,
        )}`,
      );
    }

    if (instances.size !== 2) {
      throw new Error(
        `Expected both ALB ingress hosts to reach distinct harness replicas, observed ${instances.size}: ${[
          ...instances.entries(),
        ]
          .map(([host, instance]) => `${host}=${instance}`)
          .join(', ')}`,
      );
    }

    if (instances.get(albHostA) === instances.get(albHostB)) {
      throw new Error(
        `Expected ALB ingress hosts to resolve to different harness replicas, but both used ${instances.get(
          albHostA,
        )}`,
      );
    }

    console.log(
      `AWS ALB shared throttling verified through ${albHostname}. Successful instances: ${[
        ...instances.entries(),
      ]
        .map(([host, instance]) => `${host}=${instance}`)
        .join(', ')}`,
    );
  } finally {
    try {
      kubectl(kubeconfigPath, [
        'delete',
        'namespace',
        namespace,
        '--ignore-not-found=true',
        '--wait=true',
        '--timeout=600s',
      ]);
    } catch {
      // Best-effort cleanup for external AWS infrastructure.
    }

    await image.cleanup().catch(() => undefined);
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exitCode = 1;
});
