// @ts-check
import { resolve } from "node:path";
import { cwd } from "node:process";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const project = resolve(cwd(), "tsconfig.json");

export default defineConfig(
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  eslintConfigPrettier,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },

    settings: {
      "import/resolver": {
        typescript: {
          project,
        },
      },
    },

    rules: {
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "type",
            "parent",
            "sibling",
            "index",
            "object",
          ],

          "newlines-between": "always",
          pathGroupsExcludedImportTypes: ["builtin"],

          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },

          pathGroups: [],
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // 正しく解決できないことがあるので無効化
      "import/no-unresolved": "off",
    },
  },
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/build/",
    "**/.next/",
    "**/out/",
    "**/.react-router/",
    "**/worker-configuration.d.ts",
  ]),
);
