import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@data/assignments": r("./src/data/assignments.ts") } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      reporter: ["text-summary"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
