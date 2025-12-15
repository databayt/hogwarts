/** @type {import('prettier').Config} */
module.exports = {
  // shadcn/ui official patterns
  semi: false,
  singleQuote: false,
  trailingComma: "es5",

  // Standard settings
  tabWidth: 2,
  printWidth: 80,
  bracketSpacing: true,
  endOfLine: "lf",

  // Import ordering (shadcn/ui pattern)
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^types$",
    "^@/env(.*)$",
    "^@/types/(.*)$",
    "^@/config/(.*)$",
    "^@/lib/(.*)$",
    "^@/hooks/(.*)$",
    "^@/components/ui/(.*)$",
    "^@/components/(.*)$",
    "^@/styles/(.*)$",
    "^@/app/(.*)$",
    "",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],

  // Plugins (order matters: tailwind must be last)
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
}
