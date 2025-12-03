import nextConfig from 'eslint-config-next';

const eslintConfig = [
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts'],
  },
  ...nextConfig,
];

export default eslintConfig;
