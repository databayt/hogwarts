import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config"
import rehypePrettyCode from "rehype-pretty-code"
import { z } from "zod"

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

// Help-center guides (content/docs-*/support) carry the chatbot's knowledge in
// frontmatter — scripts/build-support-index.mjs reads them. `roles` also places
// a guide under the sidebar's audience groups (one page, several groups).
const schema = frontmatterSchema.extend({
  roles: z.array(z.enum(["admin", "teacher", "parent"])).optional(),
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  flow: z.string().optional(),
  sales: z.boolean().optional(),
  guide: z.string().optional(),
  answer: z.string().optional(),
})

export const docs = defineDocs({
  dir: "content/docs-en",
  docs: { schema },
})

export const docsArabic = defineDocs({
  dir: "content/docs-ar",
  docs: { schema },
})
