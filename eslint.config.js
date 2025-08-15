// eslint.config.js (Flat config)
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier";

export default [
  // Base JS + browser/node globals
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["node_modules/**", "build/**", "dist/**", "coverage/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      prettier,
    },
    rules: {
      // ESLint recommended
      ...js.configs.recommended.rules,

      // React
      ...react.configs.recommended.rules,

      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // Prettier as an ESLint rule
      "prettier/prettier": "error",

      // Common React tweaks
      "react/react-in-jsx-scope": "off", // not needed with modern tooling
      "react/prop-types": "off", // turn on if you use PropTypes
      "react-hooks/exhaustive-deps": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
];
