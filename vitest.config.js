import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use global test APIs (describe, it, expect) without imports
    globals: true,

    // Use happy-dom for fast DOM simulation
    environment: 'happy-dom',

    // Global setup file
    setupFiles: ['./tests/setup.js'],

    // Test timeout (10 seconds)
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'tests/**',
        'js/init.js',
        '*.config.js',
        'node_modules/**'
      ]
    }
  }
})
