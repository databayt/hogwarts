# School-dashboard shared components

Cross-section pieces every school-dashboard block may import from
`@/components/school-dashboard/shared`: the listing toolbar and view toggle,
the grid card, export, AI processing badges — and the phone pattern kit below.

## Phone pattern

On a phone, `/dashboard`, `/library`, `/library/books/[id]`, `/lumos/courses`,
the lumos lesson page and `/live` share one vocabulary. Sections that follow it
(announcements, attendance, exams, finance, settings, `/transportation/me`)
compose it from this kit instead of pasting copies of those pages' files.

**The rule that makes it safe:** the phone layout lives below `md` only. Either
add `max-md:` variants to the existing element, or render a `md:hidden` phone
block beside the untouched desktop block wrapped in `hidden md:block`. Never a
width hook — the server cannot know the width, so a hook paints the desktop
layout first and swaps it a frame later, on exactly the device it is for.
Page heading, page nav, toolbars and DataTables stay as they are.

### Vocabulary (measured from the reference pages)

| Surface         | Phone rendering                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Section heading | 18px semibold, a quiet "see all" with a chevron on the same line (`SectionHeader`)                |
| Card            | `bg-muted`, 14px corners (`rounded-xl`), no border, no shadow                                     |
| Stats           | ONE grey panel, two across, hairline dividers; label xs muted, figure bold, no icon (`StatPanel`) |
| Doors / links   | iOS home-screen tiles, four across, 13px semibold labels (`AppTileGrid`, art in `public/tiles/`)  |
| Records         | Art square + title/description/meta + figure or chevron (`ListRow`, `ListRows`)                   |
| Facts           | Label start, value end, one hairline per pair (`InfoRows`)                                        |
| Hero (rare)     | Green brand banner `#00bc6d`, ink pinned `#050505`, pill actions (`BrandBanner`, `BrandPill`)     |
| Buttons         | Pills: `h-10 rounded-full px-5`, side by side — never stacked full-width bars                     |
| Listing grid    | Grey `ItemCard`s two across (`ItemGrid`), load-more pill (`ItemGridMore`)                         |

### Components

| Export                                           | File                 | Use                                                                                                 |
| ------------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------- |
| `SectionHeader`                                  | `section-header.tsx` | A section's title line                                                                              |
| `StatPanel`, `StatItem`, `StatTone`              | `stat-panel.tsx`     | Figures; tone is carried by the figure, never a tinted cell; `wide` items take a row                |
| `AppTile`, `AppTileGrid`, `TileFace`, `DateTile` | `app-tile.tsx`       | Section doors; `TileFace` alone as row art; `DateTile` for dated records                            |
| `ListRow`, `ListRows`                            | `list-row.tsx`       | Record lists; `divided` for rows without art                                                        |
| `InfoRows`                                       | `info-rows.tsx`      | Key/value facts                                                                                     |
| `ItemCard`, `ItemGrid`, `ItemGridMore`           | `item-card.tsx`      | A listing's grid view                                                                               |
| `ListingViews`                                   | `listing-views.tsx`  | Table vs grid, split by `md` while the URL names no view                                            |
| `TableGrid`, `RowActions`                        | `table-grid.tsx`     | Grid of a DataTable's own rows (toolbar filters apply) with each row's own actions cell on its card |
| `BrandBanner`, `BrandPill`, `BrandProgress`      | `brand-banner.tsx`   | The green banner; sibling of `library/hero.tsx` and `live/status-hero.tsx`                          |

### Listings: grid by default on a phone

Opt in per listing — a desktop default never changes:

```tsx
const { view, phoneView, toggleView } = usePlatformView({
  defaultView: "table",
  phoneView: "grid",
})

<PlatformToolbar view={view} phoneView={phoneView} onToggleView={toggleView} … />
<ListingViews
  view={view}
  phoneView={phoneView}
  table={<DataTable table={table} … />}
  grid={
    <TableGrid table={table} hasMore={hasMore} isLoading={isLoading} onLoadMore={loadMore}>
      {(row) => (
        <ItemCard
          key={row.id}
          href={`/${lang}/…/${row.original.id}`}
          title={row.original.name}
          value={formatCurrency(row.original.amount, lang, currency)}
          badges={<Badge …>{statusLabel}</Badge>}
          meta={formatDate(row.original.date, lang)}
          actions={<RowActions row={row} />}
        />
      )}
    </TableGrid>
  }
/>
```

While the URL has no `?view`, both views render and CSS picks one per width;
an explicit `?view=` wins at every width. `TableGrid` reads
`table.getRowModel()` (`useDataTable` paginates manually, so load-more rows are
never clipped even when the DataTable is not mounted). Adopted by:
announcements, finance fee structures / assignments / payments / fines /
scholarships, salary structures.

### Restyling an existing overview (the `max-md:` recipe)

For pages built from hand-rolled cards, add classes rather than a second tree —
see `finance/lib/dashboard-components.tsx` and `attendance/core/attendance-stats.tsx`:

- Stat grid → `max-md:bg-border max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl max-md:[&>*:last-child:nth-child(odd)]:col-span-2`
  (the 1px gap shows the border colour through as hairlines; a lone last cell spans the row).
- Stat card → `max-md:bg-muted max-md:rounded-none max-md:border-0 max-md:h-full`; icon chip `max-md:hidden`;
  label `max-md:text-xs max-md:font-normal max-md:text-muted-foreground`; figure `max-md:text-lg max-md:font-bold`
  (long money steps down to `text-base` so the currency symbol never breaks across lines).
- Section card → `max-md:bg-muted max-md:border-0`; inputs on it `max-md:bg-background`.
- Button stacks → `max-md:h-10 max-md:rounded-full max-md:px-5 max-md:w-auto` in a wrapping row.

### Gotchas

- `rtl:flex-row-reverse` under the RTL root double-flips a row — delete it.
- `hsl(var(--border))` is invalid: the tokens are OKLCH. Use `var(--border)`.
- `ar-SA` formats Hijri dates and Arabic-Indic digits; format through
  `@/lib/i18n-format` (`formatDate`, `formatCurrency`) with the page's `lang`.
- A grey chip on a grey card disappears: quiet `Badge`s on an `ItemCard` get `bg-background`.
