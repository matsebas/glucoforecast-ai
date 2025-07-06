/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/**", "components/**", "lib/**"],
      exclude: [
        "app/api/auth/**",
        "app/layout.tsx",
        "app/globals.css",
        "components/ui/**",
        "lib/db/**",
        "lib/types/**",
        "**/*.d.ts",
        "**/index.ts",
      ],
    },
  },
});
