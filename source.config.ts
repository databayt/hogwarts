import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import rehypePrettyCode, { type Options } from 'rehype-pretty-code'

// Custom transformers for code blocks
const transformers: Options['transformers'] = [
  {
    code(node) {
      const raw = (node.children?.[0] as any)?.value ?? ''

      // Store raw code for copying
      node.properties ||= {}
      node.properties['__raw__'] = raw

      // Transform package manager commands
      if (raw.startsWith('npm install') || raw.startsWith('npm i ')) {
        const npmCommand = raw
        const yarnCommand = raw
          .replace(/^npm install/, 'yarn add')
          .replace(/^npm i /, 'yarn add ')
          .replace(/ --save-dev/g, ' --dev')
          .replace(/ -D/g, ' --dev')
        const pnpmCommand = raw
          .replace(/^npm install/, 'pnpm add')
          .replace(/^npm i /, 'pnpm add ')
        const bunCommand = raw
          .replace(/^npm install/, 'bun add')
          .replace(/^npm i /, 'bun add ')

        node.properties['__npm__'] = npmCommand
        node.properties['__yarn__'] = yarnCommand
        node.properties['__pnpm__'] = pnpmCommand
        node.properties['__bun__'] = bunCommand
      }

      if (raw.startsWith('npx ')) {
        const npmCommand = raw
        const yarnCommand = raw.replace(/^npx /, 'yarn dlx ')
        const pnpmCommand = raw.replace(/^npx /, 'pnpm dlx ')
        const bunCommand = raw.replace(/^npx /, 'bunx ')

        node.properties['__npm__'] = npmCommand
        node.properties['__yarn__'] = yarnCommand
        node.properties['__pnpm__'] = pnpmCommand
        node.properties['__bun__'] = bunCommand
      }
    },
  },
]

export default defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            dark: 'github-dark',
            light: 'github-light-default',
          },
          transformers,
          defaultLang: 'typescript',
          grid: true,
          // Add support for diff highlighting
          onVisitLine(node: any) {
            // Prevent lines from collapsing in `display: grid` mode, and
            // allow empty lines to be copy/pasted
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }]
            }
          },
          onVisitHighlightedLine(node: any) {
            if (!node.properties.className) {
              node.properties.className = []
            }
            node.properties.className.push('highlighted')
          },
          onVisitHighlightedChars(node: any) {
            node.properties.className = ['word']
          },
        } satisfies Options,
      ],
    ],
    remarkPlugins: [],
  },
})

// Define the docs source location
export const docs = defineDocs({
  dir: 'content/docs',
})