import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "**/dist/**",
      "build/**",
      "**/build/**",
      "out/**",
      "**/out/**",
      ".next/**",
      "**/.next/**",
      "coverage/**",
      "**/coverage/**",
      ".cache/**",
      "**/.cache/**",
      "artifacts/**",
      "**/artifacts/**",
      "cache/**",
      "**/cache/**",
      "typechain/**",
      "typechain-types/**",
      "broadcast/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["frontend/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        document: "readonly",
      },
    },
  },
);
