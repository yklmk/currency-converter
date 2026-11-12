import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
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
  tailwind.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: join(rootDir, "styles/globals.css"),
      },
      next: {
        rootDir: ["./"],
      },
    },
    rules: {
      "no-nested-ternary": "error",
      "prettier/prettier": "warn",
    },
  },
]

export default config
