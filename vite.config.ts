import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// `base: "./"` keeps asset paths relative, so the build works on GitHub Pages
// under any repository name. Screens use the URL hash, so no 404 fallback is needed.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // E2E builds swap in a public fixture draw so the real draw is never rendered by tests.
      "@data/assignments":
        mode === "e2e" ? r("./tests/fixtures/assignments.e2e.ts") : r("./src/data/assignments.ts"),
    },
  },
}));
