import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Next.jsのApp Routerディレクトリは除外
    files: ['./src/**'],
    ignores: ['./src/app/**'],
  },
]);
