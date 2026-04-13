import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Override postcss.config.mjs — Tailwind v4's @tailwindcss/postcss plugin
  // is incompatible with Vite's built-in PostCSS loader in test mode
  css: {
    postcss: {},
  },
  test: {
    globals: true,
    environment: "node",
    css: false,
    include: ["src/**/__tests__/**/*.test.ts", "functions/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/tpmos/domain/**/*.ts",
        "functions/_lib/auth/**/*.ts",
      ],
      exclude: ["**/__tests__/**", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
