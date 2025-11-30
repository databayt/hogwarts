// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import rehypePrettyCode from "rehype-pretty-code";
var transformers = [
  {
    code(node) {
      const raw = node.children?.[0]?.value ?? "";
      node.properties ||= {};
      node.properties["__raw__"] = raw;
      if (raw.startsWith("npm install") || raw.startsWith("npm i ")) {
        const npmCommand = raw;
        const yarnCommand = raw.replace(/^npm install/, "yarn add").replace(/^npm i /, "yarn add ").replace(/ --save-dev/g, " --dev").replace(/ -D/g, " --dev");
        const pnpmCommand = raw.replace(/^npm install/, "pnpm add").replace(/^npm i /, "pnpm add ");
        const bunCommand = raw.replace(/^npm install/, "bun add").replace(/^npm i /, "bun add ");
        node.properties["__npm__"] = npmCommand;
        node.properties["__yarn__"] = yarnCommand;
        node.properties["__pnpm__"] = pnpmCommand;
        node.properties["__bun__"] = bunCommand;
      }
      if (raw.startsWith("npx ")) {
        const npmCommand = raw;
        const yarnCommand = raw.replace(/^npx /, "yarn dlx ");
        const pnpmCommand = raw.replace(/^npx /, "pnpm dlx ");
        const bunCommand = raw.replace(/^npx /, "bunx ");
        node.properties["__npm__"] = npmCommand;
        node.properties["__yarn__"] = yarnCommand;
        node.properties["__pnpm__"] = pnpmCommand;
        node.properties["__bun__"] = bunCommand;
      }
    }
  }
];
var source_config_default = defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            dark: "github-dark",
            light: "github-light-default"
          },
          transformers,
          defaultLang: "typescript",
          grid: true,
          // Add support for diff highlighting
          onVisitLine(node) {
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
          },
          onVisitHighlightedLine(node) {
            if (!node.properties.className) {
              node.properties.className = [];
            }
            node.properties.className.push("highlighted");
          },
          onVisitHighlightedChars(node) {
            node.properties.className = ["word"];
          }
        }
      ]
    ],
    remarkPlugins: []
  }
});
var docs = defineDocs({
  dir: "content/docs"
});
var docsArabic = defineDocs({
  dir: "content/docs-ar"
});
export {
  source_config_default as default,
  docs,
  docsArabic
};
