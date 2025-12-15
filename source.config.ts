import { defineConfig, defineDocs } from "fumadocs-mdx/config"
import rehypePrettyCode from "rehype-pretty-code"

import { transformers } from "./src/lib/highlight-code"

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => {
      plugins.shift()
      plugins.push([
        rehypePrettyCode as any,
        {
          theme: {
            dark: "github-dark",
            light: "github-light-default",
          },
          transformers,
        },
      ])

      return plugins
    },
  },
})

export const docs = defineDocs({
  dir: "content/docs",
})

export const docsArabic = defineDocs({
  dir: "content/docs-ar",
})
