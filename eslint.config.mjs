import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "out/**",
      ".next/**",
      "coverage/**",
      ".cache/**",
      "artifacts/**",
      "cache/**",
      "typechain/**",
      "typechain-types/**",
      "broadcast/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
