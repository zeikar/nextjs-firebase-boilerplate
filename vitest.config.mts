import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// `server-only` is a marker package whose default export throws on import. The
// server build picks its `react-server` condition instead, which resolves to an
// empty module - tests have to do the same to load anything that imports it.
const serverOnlyConditions = ["react-server"];

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
    conditions: serverOnlyConditions,
  },
  ssr: {
    resolve: {
      conditions: serverOnlyConditions,
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["app/**", "components/**", "contexts/**", "lib/**"],
    },
  },
});
