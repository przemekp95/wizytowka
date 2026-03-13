import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { withBotId } from 'botid/next/config';

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendDir, '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
};

export default withBotId(nextConfig);
