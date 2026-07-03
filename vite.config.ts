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
            if (id.includes("react-router-dom") || id.includes("@remix-run") || id.includes("react-router")) {
              return "vendor-react-router";
            }
            if (id.includes("react-dom") || id.includes("react/")) {
              return "vendor-react-dom";
            }
            if (id.includes("scheduler")) {
              return "vendor-react-core";
            }
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-recharts";
            }
            if (id.includes("hls.js")) {
              return "vendor-hls";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("stripe") || id.includes("@stripe")) {
              return "vendor-stripe";
            }
            return "vendor-libs";
          }
        },
      },
    },
  },
});
