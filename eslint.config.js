// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier"; // flat-compatible

export default [
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["node_modules/**", "build/**", "dist/**", "coverage/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      prettier: prettierPlugin,
    },
    rules: {
      // Base recommendations
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Make Prettier violations show as ESLint errors
      ...prettierPlugin.configs.recommended.rules,

      // Keep React tweaks
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/exhaustive-deps": "off",

      // Align with Prettier "trailingComma": "all"
      "comma-dangle": ["error", "always-multiline"],
      // If you set "trailingComma": "none", change to:
      // "comma-dangle": ["error", "never"],
    },
    settings: { react: { version: "detect" } },
  },

  // Disable any remaining stylistic rules that may conflict with Prettier
  eslintConfigPrettier,
];
