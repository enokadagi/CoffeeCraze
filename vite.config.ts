/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, type PluginOption} from 'vite';
import {loadEnv} from 'vite';

// Production-only plugin: replaces dev-only modules with no-ops
// to prevent accidental exposure in the client bundle.
function excludeDevOnly(...paths: string[]): PluginOption {
  const resolved = new Set(paths.map((p) => path.resolve(__dirname, p)));
  return {
    name: 'exclude-dev-only',
    enforce: 'post',
    resolveId(source, importer) {
      if (!importer) return null;
      const resolvedId = path.resolve(path.dirname(importer), source);
      if (resolved.has(resolvedId)) return '\0excluded:' + resolvedId;
      return null;
    },
    load(id) {
      if (id.startsWith('\0excluded:')) return 'export default {};';
      return null;
    },
  };
}

// Injects Firebase env vars into the messaging service worker at build time.
// public/firebase-messaging-sw.js is copied to dist verbatim (public dir files
// do NOT go through the transform pipeline), so we rewrite the emitted file
// in closeBundle after the build writes the output directory.
function injectFirebaseConfigIntoSw(mode: string, outDir: string): PluginOption {
  const envKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ] as const;
  return {
    name: 'inject-firebase-config-into-sw',
    enforce: 'post',
    // In dev, serve a transformed copy of the SW with env vars substituted so
    // push notifications can be tested on localhost without a production build.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url !== '/firebase-messaging-sw.js') return next();
        try {
          const env = loadEnv(mode, process.cwd(), '');
          const swPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');
          if (!fs.existsSync(swPath)) return next();
          let code = fs.readFileSync(swPath, 'utf8');
          for (const key of envKeys) {
            const value = env[key] || '';
            code = code.split(`__${key}__`).join(value);
          }
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Service-Worker-Allowed', '/');
          res.end(code);
        } catch {
          next();
        }
      });
    },
    closeBundle() {
      try {
        const env = loadEnv(mode, process.cwd(), '');
        const swPath = path.join(outDir, 'firebase-messaging-sw.js');
        if (!fs.existsSync(swPath)) {
          console.warn('[vite:inject-sw] firebase-messaging-sw.js not found in output — skipping.');
          return;
        }
        let code = fs.readFileSync(swPath, 'utf8');
        for (const key of envKeys) {
          const value = env[key] || '';
          code = code.split(`__${key}__`).join(value);
        }
        fs.writeFileSync(swPath, code, 'utf8');
        console.log('[vite:inject-sw] Firebase config injected into firebase-messaging-sw.js');
      } catch (err) {
        console.error('[vite:inject-sw] Failed to inject config:', err);
      }
    },
  };
}

export default defineConfig(({mode}) => {
  const isProd = mode === 'production';
  return {
    plugins: [react(), tailwindcss(), injectFirebaseConfigIntoSw(mode, 'dist'), isProd && excludeDevOnly('src/utils/dbSeeder.ts')].filter(Boolean),
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      testTimeout: 15000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            const parts = id.split('node_modules/')[1] || id.split('node_modules\\')[1];
            if (!parts) return undefined;
            const segments = parts.split('/');
            const pkgName = segments[0].startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0];

            // Avoid generating per-package vendor chunks for these small/edge packages
            // which can often lead to empty chunk warnings.
            const excludeDeps = [
              'react-router-dom',
              'set-cookie-parser',
              'motion',
              'micromark-util-encode'
            ];
            if (excludeDeps.some((e) => pkgName.includes(e))) return undefined;

            // Only create vendor chunks for larger/critical dependencies to avoid
            // many tiny or empty vendor files. This prevents empty-chunk warnings
            // and keeps bundle count reasonable.
            const heavyDeps = [
              'react',
              'react-dom',
              'recharts',
              'firebase',
              'xlsx',
              'lucide-react',
              'google',
              '@google',
              '@firebase',
              'tailwind-merge',
              'sonner'
            ];

            if (heavyDeps.some((h) => pkgName.includes(h))) {
              return `vendor_${pkgName.replace('@', '').replace('/', '_')}`;
            }

            // Let Rollup handle smaller deps together (default behavior)
            return undefined;
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify -- file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
