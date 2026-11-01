import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// Production only: the dev server needs its websocket (spec 3.5).
const CSP =
  "default-src 'self'; img-src 'self' data: blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'";

function contentSecurityPolicy(): Plugin {
  return {
    name: 'thermostat-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), contentSecurityPolicy()],
  // never inline assets as data: URIs (the production CSP allows fonts from 'self' only)
  build: { target: 'es2022', chunkSizeWarningLimit: 2500, assetsInlineLimit: 0 },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
  },
});
