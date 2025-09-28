import { dirname, resolve } from "node:path";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";

import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const project = resolve(cwd(), "tsconfig.json");

export default defineConfig([
  {
    extends: fixupConfigRules(
      compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
      ),
    ),

    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      "unused-imports": unusedImports,
    },

    languageOptions: {
      parser: tsParser,

      parserOptions: {
        project,
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
    },
  },
  globalIgnores(["**/node_modules/", "**/dist/"]),
]);
