# Docs Style Guide — `content/docs-en/`

Single source of truth for writing MDX documentation in this repo. If a doc disagrees with this file, the file wins — fix the doc.

## Voice

One voice everywhere except `business/` group:

- **Default — Neutral technical reference.** Direct, terse, present-tense. Tell the reader what something is and how to use it. No motivational prose.
- **Business group only** (`pitch`, `sales`, `business-model`, `competitors`, `shared-economy`) — investor/customer narrative is the point. Marketing tone allowed here, banned elsewhere.

Banned phrases in technical docs (architecture, multi-tenancy, mvp, pattern, all feature pages, all reference pages):

- "magic when you see it", "operating system for the digital age", "escape from the matrix"
- "more than X — it's Y"
- "we sell time", "currency that drives the world"
- Generic intros: "In modern web development …", "Today's applications …"
- Restating what the section heading already said

## Frontmatter

Two keys required, third optional. Nothing else.

```yaml
---
title: Fee Management
description: Manage fee structures, assign to students, collect payments and reminders.
category: features
---
```

- `title` — under 60 chars. No period. Sentence case.
- `description` — 80–160 chars. Real one-liner. **Never** start with "Documentation for" or restate the title.
- `category` — optional. One of: `getting-started`, `architecture`, `patterns`, `features`, `reference`, `business`, `community`. Used for filtering / future grouping.

Unquoted values unless they contain `:` or `#`. No `links` field — fumadocs already wires prev/next.

## Headings

The page renderer prints frontmatter `title` as the page `<h1>`. **Never write `# Title` in the body** — it produces a duplicate `<h1>` and breaks the heading outline.

Body starts at `## Section`. Hierarchy is strict: don't skip levels (`##` → `####` is wrong).

## Length caps

| Category  | Cap       | Examples                                       |
| --------- | --------- | ---------------------------------------------- |
| Guide     | 250 lines | `contributing`, `code-of-conduct`, `localhost` |
| Feature   | 500 lines | `attendance`, `fees`, `students`, `timetable`  |
| Pattern   | 600 lines | `page`, `actions`, `form`, `table`             |
| Reference | 800 lines | `catalog`, `multi-tenancy`, `database`         |

If you exceed the cap, split or trim. No exceptions without a comment in the doc explaining why.

## Status sections

**Banned everywhere.** Don't write "Production Readiness," "Known Issues," "Implementation Status," "What's Done / What's Not," roadmaps, or per-doc TODO lists. Track that in GitHub Issues.

The whole class of "this doc partially documents partially-finished work" is the source of contradictory status. Document what exists; link to issues for what doesn't.

## Components

Five doc-specific MDX components are registered. Use them instead of inline JSX/Tailwind.

### `<Callout>`

For warnings, tips, info that interrupts the prose flow. Replaces blockquote-with-emoji and `<div className="bg-yellow-50…">`.

```mdx
<Callout type="info">Default. For neutral asides.</Callout>
<Callout type="tip">For "did you know" / shortcut notes.</Callout>
<Callout type="warning">For non-blocking gotchas.</Callout>
<Callout type="danger">For data-loss / security risks.</Callout>
<Callout type="warning" title="Heads up">
  With a title.
</Callout>
```

### `<CardGrid>` + `<DocCard>`

For card grids on landing pages and overview docs. Replaces inline `<div className="grid grid-cols-3 …">`.

```mdx
<CardGrid cols={3}>
  <DocCard
    title="Get started"
    href="/docs/get-started"
    description="Clone, install, run in under 5 minutes."
  />
  <DocCard
    title="Architecture"
    href="/docs/architecture"
    description="Mirror pattern, multi-tenancy, server actions."
  />
  <DocCard
    title="Contributing"
    href="/docs/contributing"
    description="How to ship your first PR."
  />
</CardGrid>
```

`cols` defaults to `2`. Valid: `1 | 2 | 3 | 4`. Omit `href` for non-clickable tiles.

### `<Steps>` / `<Step>`

For numbered walkthroughs (already registered). One `<Step>` per step, with an `<h3>` title.

### `<Tabs>` / `<TabsList>` / `<TabsTrigger>` / `<TabsContent>`

For named-tab content (already registered). Use sparingly — markdown is more searchable.

### Flow components

`AuthFlowDiagram`, `OnboardingWizardFlow`, `LoginFlow`, etc. are pre-registered. Use them instead of ASCII diagrams when documenting flows that already have a registered component.

## CardGrid vs markdown table

| Use `<CardGrid>` when                              | Use a markdown table when                         |
| -------------------------------------------------- | ------------------------------------------------- |
| Items are navigation targets (links)               | Items are reference data (specs, prices, configs) |
| Each item has 1–2 lines of body text               | Each item is a single-cell value                  |
| Visual scanning matters more than dense comparison | Side-by-side comparison matters                   |

If in doubt, table. Tables translate, sort, and copy-paste cleanly.

## Code blocks

Always tag the language. Always close fences. Use the `__npm__` / `__pnpm__` / `__yarn__` / `__bun__` pattern for install commands — the renderer auto-tabs them.

```ts
// Good
import { db } from "@/lib/db"
```

````
```bash
__npm__
npm install foo
__pnpm__
pnpm add foo
```
````

## Links

Internal: `/docs/<slug>` — relative path, no locale prefix, no `.mdx` extension. Slugs are kebab-case file names without extension.

External: full URL, no tracking params. Use markdown link syntax `[text](url)`, not raw `<a>`.

## Hardcoded styles — banned

Never write `className="text-xl"`, `className="font-bold"`, `className="text-blue-600"`, hex colors, or RGB values in MDX bodies.

The renderer styles headings, paragraphs, lists, tables, code blocks, blockquotes — trust it. If you need emphasis the renderer doesn't provide, you need a registered MDX component (file an issue, don't inline).

Theme-aware tokens only when you do need a class on a wrapper: `text-foreground`, `text-muted-foreground`, `text-primary`, `bg-card`, `bg-muted`, `border-border`.

## RTL

Use logical CSS properties only: `ms-` / `me-` / `ps-` / `pe-` / `start-` / `end-`. Never `ml-` / `pl-` / `left-` / `right-`. The Arabic mirror at `content/docs-ar/` reuses the same components.

## Diagrams

In priority order:

1. Drop the diagram if the prose already explains it.
2. Use a registered flow component (`AuthFlowDiagram`, etc.).
3. Use Mermaid (fumadocs supports it via code fence).
4. Use an SVG image under `public/docs-diagrams/`.
5. **Last resort:** ASCII art. Keep it under 30 lines.

## Voice and tense

- Present tense ("the action returns", not "the action will return").
- Imperative for instructions ("run `pnpm dev`", not "you should run `pnpm dev`").
- "We" only in business-group docs. Technical docs are voiceless.
- "You" sparingly, only when addressing a reader's action.

## Pre-commit

Run `pnpm docs:lint` before committing. CI will run it too.

The lint catches: duplicate body H1, placeholder descriptions, hardcoded `text-*` / `font-*` classes, broken `/docs/<slug>` links, files over the category cap.
