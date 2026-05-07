import { defineConfig, defineDocs } from "fumadocs-mdx/config"

// Build-time shiki is disabled — `rehype-pretty-code` was OOMing the Vercel
// Hobby 8 GB heap when compiling 111 MDX files with two themes.
// Code blocks are highlighted at render time instead, via fumadocs-ui's
// `DynamicCodeBlock` (lazy `import("shiki")` in the browser, JS regex engine,
// no oniguruma WASM). See `src/mdx-components.tsx` for the pre/code overrides
// and `src/lib/detect-npm-command.ts` for the package-manager-tab logic that
// previously rode along with the shiki transformer.
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: false,
  },
})

export const docs = defineDocs({
  dir: "content/docs-en",
})

export const docsArabic = defineDocs({
  dir: "content/docs-ar",
})
