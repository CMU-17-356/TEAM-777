import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        console: true,
        document: true, 
        window: true,   
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react": react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "jsx-a11y/anchor-is-valid": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
    ignores: ["node_modules", "dist", "build"],
  },
];
