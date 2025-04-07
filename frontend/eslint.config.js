import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules", "dist", "build"], // ✅ Correct placement
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname, // ✅ Ensures correct project root
      },
      globals: {
        console: true,
        document: true,
        window: true,
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {  // ✅ CHANGE ARRAY TO OBJECT
      "@typescript-eslint": tseslint,
      "react": react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "react/jsx-uses-react": "off",
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      "react/react-in-jsx-scope": "off",
      "jsx-a11y/anchor-is-valid": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
