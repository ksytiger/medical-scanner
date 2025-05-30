import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "./tests/__tests__/**/*.test.ts",
      "./tests/__tests__/**/*.test.tsx",
    ],
    deps: {
      inline: ["@supabase/ssr", "@supabase/supabase-js"],
    },
  },
});
