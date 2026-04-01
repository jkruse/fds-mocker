import { createRequire } from 'module';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const require = createRequire(import.meta.url);
const dkfdsVersion = require('./node_modules/dkfds/package.json').version;

export default defineConfig({
  base: '/fds-mocker/',
  plugins: [vue()],
  define: {
    __DKFDS_VERSION__: JSON.stringify(dkfdsVersion),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/__tests__/**', 'src/**/*.test.{js,vue}'],
    },
  },
})
