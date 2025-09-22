import { defineConfig } from "vite";
import { visualizer } from 'rollup-plugin-visualizer'
import dotenv from 'dotenv';
import path from 'node:path';
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import compression from 'vite-plugin-compression'
import zlib from 'zlib'

dotenv.config();

const ANALYZE = process.env.ANALYZE === 'true';
const USE_SIMPLE_PROTECTION = process.env.VITE_APP_USE_SIMPLE_PROTECTION === 'true';

// https://vite.dev/config/
export default defineConfig({
  server: {
    // host: '0.0.0.0',
    port: parseInt(process.env.VITE_APP_PORT || '8085'),
    strictPort: true // optional: gagal jika port sudah digunakan
  },
  preview: {
    port: parseInt(process.env.VITE_PREVIEW_PORT || '8087')
  },
  build: {
    sourcemap: true, // Enable source maps for debugging
    chunkSizeWarningLimit: 600, // Increase warning limit since we have intentional large chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'charts': ['react-apexcharts', 'apexcharts'],
          'calendar': [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/timegrid'
          ],
          'upload': ['file-selector', 'react-dropzone'],
          'icons': ['react-icons', '@heroicons/react'],
          'ui-libs': [
            '@headlessui/react',
            'framer-motion',
            'react-hot-toast',
            'swiper'
          ],
          'table-libs': ['@tanstack/react-table'],
          'auth-libs': ['@react-oauth/google'],
          'utils': ['clsx', 'tailwind-merge', 'dompurify'],
          // pisahkan library berat lainnya
          // 'date-utils': ['date-fns'],
          // buat chunk khusus untuk halaman tertentu jika SSR atau SPA multi-page
        },
      },
    },
  },

  resolve: {
    alias: {
      // '@security': USE_SIMPLE_PROTECTION
      //   ? path.resolve(__dirname, 'src/stubs/BrowserSecurity/noopSecurity.ts')
      //   : path.resolve(__dirname, 'modules/BrowserSecurity/frontend/utils/securityManager.ts'),
      '@bs': USE_SIMPLE_PROTECTION
        ? path.resolve(__dirname, 'modules/BrowserSecurity')
        : path.resolve(__dirname, 'src/stubs/BrowserSecurity'),
    },
  },

  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
    compression({
      algorithm: 'brotliCompress',
      compressionOptions: {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
      },
    }),
    // compression({
    //   verbose: true,
    //   disable: false,
    //   threshold: 10240,
    //   algorithm: 'gzip',
    //   ext: '.gz',
    // }),

    // Bundle stats visualizer (run with: ANALYZE=true vite build)
    visualizer({
      filename: 'docs/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: ANALYZE
    }),
  ],
});
