import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/miniappExperiment/",
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      assert: "assert",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify",
      url: "url",
    },
  },
});
