import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const backendPackage = require('../../package.json') as {
  engines?: {
    node?: string;
  };
  devDependencies?: Record<string, string>;
};

describe('backend tooling compatibility', () => {
  it('pins a cucumber release that explicitly supports Node 22', () => {
    const cucumberVersion =
      backendPackage.devDependencies?.['@cucumber/cucumber'] ?? '';
    const cucumberMajor = Number.parseInt(
      cucumberVersion.replace(/^[^\d]*/, '').split('.')[0] ?? '0',
      10,
    );

    expect(cucumberMajor).toBeGreaterThanOrEqual(12);
    expect(backendPackage.engines?.node).toContain('22');
  });

  it('does not present the local compose stack as a production deployment', () => {
    const compose = readFileSync(
      resolve(__dirname, '../../../docker-compose.yml'),
      'utf8',
    );

    expect(compose).not.toContain('profiles: ["dev", "staging", "prod"]');
    expect(compose).not.toContain('POSTGRES_PASSWORD: super_tajne_haslo');
    expect(compose).not.toContain('MONGO_INITDB_ROOT_PASSWORD: root');
    expect(compose).not.toContain('GF_SECURITY_ADMIN_PASSWORD=admin');
  });
});
