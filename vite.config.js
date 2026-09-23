import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
  },
  build: {
    target: "es2019",
    sourcemap: false,
  },
});
