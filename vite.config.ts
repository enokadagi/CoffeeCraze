import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
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
              'framer-motion',
              'lucide-react',
              'google',
              '@google',
              '@firebase',
              'redux',
              'reduxjs-toolkit',
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
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
