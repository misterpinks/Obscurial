
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configure base path for electron build
  base: process.env.ELECTRON_RUN ? './' : '/',
  build: {
    outDir: 'dist',
    sourcemap: process.env.ELECTRON_RUN ? false : true,
    // Make sure Electron can access the built files
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        format: process.env.ELECTRON_RUN ? 'cjs' : 'esm',
      }
    },
    // Optimize for Electron
    target: process.env.ELECTRON_RUN ? 'chrome108' : 'modules',
    // Always use esbuild for minification - resolves terser dependency issues
    minify: 'esbuild',
  },
  // Ensure proper handling of static assets for Electron
  publicDir: 'public',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'face-api.js'],
    // Completely exclude all native compilation modules
    exclude: process.env.ELECTRON_RUN ? [
      'fsevents', 
      '@electron/node-gyp', 
      'node-gyp',
      'native-modules',
      'rebuild'
    ] : []
  },
  // Fix for Electron - provide Node.js polyfills for browser environment
  define: {
    'process.env': process.env,
    'global': 'globalThis',
    // Disable native module compilation
    'process.env.npm_config_node_gyp': JSON.stringify(''),
    'process.env.npm_config_rebuild': JSON.stringify('false'),
  },
  // Electron-specific performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));
