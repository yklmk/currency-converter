import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import typescriptParser from "@typescript-eslint/parser"
import prettierConfig from "eslint-config-prettier/flat"
import prettierPlugin from "eslint-plugin-prettier"
import tailwind from "eslint-plugin-tailwindcss"

const rootDir = dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({ baseDirectory: rootDir })

const config = [
  {
    ignores: [".next/**", "dist/**", ".cache/**", "public/**", "**/*.esm.js"],
  },
  ...compat.extends("next/core-web-vitals"),
  ...tailwind.configs["flat/recommended"],
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: join(rootDir, "tailwind.config.ts"),
      },
      next: {
        rootDir: ["./"],
      },
    },
    rules: {
      "prettier/prettier": "warn",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
    },
  },
]

export default config
