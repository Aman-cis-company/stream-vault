import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    allowedHosts: [
      'vnak3000.elb.cisinlive.com'
    ],
    proxy: {
      "/api": {
        target: "https://vnak5000.elb.cisinlive.com",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://vnak5000.elb.cisinlive.com",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/uploads": {
        target: "https://vnak5000.elb.cisinlive.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: false,
    allowedHosts: [
      'vnak3000.elb.cisinlive.com'
    ],
    proxy: {
      "/api": {
        target: "https://vnak5000.elb.cisinlive.com",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://vnak5000.elb.cisinlive.com",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/uploads": {
        target: "https://vnak5000.elb.cisinlive.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
