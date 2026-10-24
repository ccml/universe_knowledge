import { defineConfig } from 'vitest/config';

// Tests du script de contenu (Node). Les tests Angular passent par `ng test`.
export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ['**/*.test.mjs'],
    environment: 'node',
  },
});
