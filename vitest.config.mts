import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only` is a marker package whose default export throws on
      // import; the server build resolves it to an empty module through the
      // `react-server` export condition. Aliasing it to a stub does the same
      // here. Turning that condition on globally would work for the server
      // suites but resolve `react-dom/client` to its React Server Components
      // build, breaking every client-side test.
      "server-only": fileURLToPath(
        new URL("./__tests__/stubs/server-only.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["app/**", "components/**", "contexts/**", "lib/**"],
    },
  },
});
