
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
  // Configure base path differently for electron build
  base: process.env.ELECTRON_RUN ? './' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Make sure Electron can access the built files
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // Ensure proper handling of static assets for Electron
  publicDir: 'public',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'face-api.js']
  },
  // Fix for Electron - provide Node.js polyfills for browser environment
  define: {
    'process.env': process.env,
    'global': 'globalThis',
  }
}));
