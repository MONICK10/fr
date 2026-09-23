import { defineConfig } from "vite";

// GitHub Pages serves this project from https://monick10.github.io/fr/ —
// a subfolder, not the domain root — so assets need that "/fr/" prefix
// only for that build. Netlify/Vercel/local dev serve from "/", unaffected.
const base = process.env.DEPLOY_TARGET === "gh-pages" ? "/fr/" : "/";

export default defineConfig({
  base,
  server: {
    host: true,
  },
  build: {
    target: "es2019",
    sourcemap: false,
  },
});
