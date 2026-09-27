import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts on purpose: vite.config.ts sets
// `root: 'frontend'`, which would hide the top-level `tests/` directory.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
