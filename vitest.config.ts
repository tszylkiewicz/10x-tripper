import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".astro"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/**",
        "dist/**",
        ".astro/**",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@preferences": path.resolve(__dirname, "./src/features/preferences"),
      "@trip-plans": path.resolve(__dirname, "./src/features/trip-plans"),
      "@auth": path.resolve(__dirname, "./src/features/auth"),
      "@dashboard": path.resolve(__dirname, "./src/features/dashboard"),
      "@landing": path.resolve(__dirname, "./src/features/landing"),
      "@feature-flags": path.resolve(__dirname, "./src/feature-flags/index.ts"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@ui": path.resolve(__dirname, "./src/components/ui"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@db": path.resolve(__dirname, "./src/db"),
      "@errors": path.resolve(__dirname, "./src/errors"),
      "@types": path.resolve(__dirname, "./src/types.ts"),
    },
  },
});
