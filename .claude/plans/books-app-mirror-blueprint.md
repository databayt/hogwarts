# Books mirror — blueprint

**Goal.** Make the two Books surfaces in hogwarts a measured mirror of the current Apple Books app on
iPhone: the library **book page** (`/library/books/[id]`, the Book Store detail page) and the
**textbook reader** (`/subjects/[slug]/textbook`, the reading surface with its menu and sheets).

**Source of truth.** The twenty-three device captures in `public/books-app/` (iPhone, 390×844 pt at
3x, 1170×2532 px; twelve from 2026‑09‑07, three from 2026‑09‑10, eight added 2026‑09‑11 19:03–19:14
— the `(1)`/`(2)` files are byte-identical duplicates and are ignored). Nothing in this document outranks a
capture. Where a capture does not exist (library home, tab-bar destinations, subject page) there is
no pixel spec, and this document says so rather than inventing one.

**Method.** Every number below is in **points on a 390×844 screen** (1 pt = 1 CSS px at 1x). It was
read off the 3x PNGs with PIL (bounding boxes of exact/near colours, row profiles for text extents,
averaged samples for fills) and cross-checked against 1:1 crops. Current-state numbers come from
the working tree rendered by headless Chromium at the same device size (`scratchpad/ours/*`),
captured 2026‑09‑11 with the welcome dialog dismissed.

**Provenance tags** — read them before trusting a number:

| Tag   | Meaning                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[M]` | measured clean off a capture (PIL bbox / run-length on an exact colour)                                                                                                   |
| `[C]` | read off a 1:1 or 0.5 crop by eye, ±2 pt                                                                                                                                  |
| `[K]` | Apple's iOS 26 Figma kit, file `iuYSGaRV8xkcEGnyIltPRg` (nodes 20:476 Sheet, 22:707 Context Menu, 22:277 Action Sheet, 1:59 glass button, 5:596 tab bar) via the REST API |
| `[P]` | measured in an earlier session and recorded in the block records / memory                                                                                                 |
| `[R]` | public source (URL cited)                                                                                                                                                 |
| `[U]` | not verified — treat as a hypothesis                                                                                                                                      |

Type sizes are derived from cap-height (SF Pro cap = 0.705 em; the serif cap ≈ 0.70 em) and are
±1 pt unless tagged `[K]`.

---

## 0. What exists today

| Half             | Route                       | Code                                                                                                                                                  | Built from                         | State                                                                                                                                                                 |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store page       | `/library/books/[id]`       | `src/components/library/book-detail/{content,hero,about,info-list,book-shelf,borrow-book}.tsx`, `library/book-jacket.tsx`                             | IMG_2572–2573                      | committed on `main` (`f169ca3bd`… `f02d65a70`)                                                                                                                        |
| Reader           | `/subjects/[slug]/textbook` | `src/components/school-dashboard/listings/subjects/textbook/*` (`book.tsx`, `sheets.tsx`, `cover.tsx`, `toc.tsx`, `reader.css`, engine)               | IMG_2572–2583, then 2595/2596/2598 | committed through `71bb30cab`; **uncommitted WIP** in `prefs.ts`, `engine.ts`, `format.ts`, `content.tsx` belongs to another session — do not edit those in this pass |
| Shared iOS atoms | `/messages`                 | `school-dashboard/messaging/mobile/{ios-tabbar,ios-header,wa-icon}.tsx`, `.wa-glass-control`, `.wa-glass-tabbar`, `.font-ios-system` in `globals.css` | Figma kit nodes 1:59 / 5:596       | committed; reusable as-is                                                                                                                                             |

The reader is the stronger half: pagination, contents, search, six themes, light/dark, brightness,
scrub, bookmarks, line guide, rotation lock, share are all implemented and behave like the
reference. Its remaining gaps are metric (type sizes, pill heights, card ratios), one interaction
defect (§7) and motion. The store page has the right skeleton (tinted panel, cover, eyebrow, title,
author, rating, action card, publisher block, information, shelves) but diverges in ground colour,
header chrome, menu, sheet, and every size below the fold.

### Capture inventory

| Capture        | Screen                                                               | Mirrors                                        | Spec § |
| -------------- | -------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| IMG_2572       | Store page, top                                                      | `book-detail/hero.tsx`                         | 1      |
| IMG_2573       | Store page, scrolled                                                 | `about.tsx`, `info-list.tsx`, `book-shelf.tsx` | 2      |
| IMG_2574       | ⋯ context menu                                                       | — (missing)                                    | 3      |
| IMG_2575       | "Added" alert                                                        | — (missing)                                    | 4      |
| IMG_2576       | + → ✓ after Want to Read                                             | — (missing)                                    | 4      |
| IMG_2577       | "From the Publisher" sheet                                           | `about.tsx` (inline More today)                | 5      |
| IMG_2578       | Reader page, chapter opener, GET card, chrome                        | `book.tsx`, `article.tsx`, `reader.css`        | 6      |
| IMG_2579       | Reading menu                                                         | `sheets.tsx` ReadingMenu                       | 7      |
| IMG_2580       | Search sheet + keyboard                                              | `sheets.tsx` SearchSheet                       | 8      |
| IMG_2581, 2582 | Page with chrome hidden (folio only), chapter 2 opener               | `book.tsx`                                     | 6      |
| IMG_2583       | Page 10 with chrome + GET card                                       | `book.tsx`                                     | 6      |
| IMG_2595       | Menu with "Bookmarks & Highlights" pill, return chip, justified text | `sheets.tsx`                                   | 7      |
| IMG_2596       | Themes & Settings sheet                                              | `sheets.tsx` SettingsSheet                     | 9      |
| IMG_2598       | Contents sheet                                                       | `sheets.tsx` ContentsSheet, `toc.tsx`          | 10     |

---

### Captures added 2026‑09‑11 (after the first pass)

| Capture  | Screen                                                       | Mirrors                                  | Spec § |
| -------- | ------------------------------------------------------------ | ---------------------------------------- | ------ |
| IMG_2609 | Search sheet with the Arabic keyboard                        | `sheets.tsx` SearchSheet                 | 8      |
| IMG_2610 | Line guide on (one line lit, the rest dimmed), chrome hidden | `book.tsx` guide, `reader.css`           | 6b     |
| IMG_2611 | "Background Dimming" menu from the line-guide disc           | — (missing)                              | 6b     |
| IMG_2612 | "Bookmark: Added" head message, red badge on the menu disc   | `book.tsx` toast                         | 7b     |
| IMG_2613 | Chrome hidden with a bookmarked page: red bookmark disc      | — (missing)                              | 7b     |
| IMG_2614 | Bookmarks & Highlights sheet, Bookmarks tab                  | Contents sheet's Bookmarks heading today | 7b     |
| IMG_2615 | Highlights tab, empty state                                  | — (no highlights)                        | 7b     |
| IMG_2616 | Select mode: radio circles, trash disc                       | — (missing)                              | 7b     |

### Captures added 2026‑09‑20 (page turn + dimming menu)

| Capture  | Screen                                                         | Mirrors                        | Spec § |
| -------- | -------------------------------------------------------------- | ------------------------------ | ------ |
| IMG_2739 | Turn, early — outgoing page barely started, next page a sliver | `book.tsx` turn, `reader.css`  | 6c     |
| IMG_2740 | Turn, mid — outgoing ~68 %, next page trailing behind, dimmed  | `book.tsx` turn                | 6c     |
| IMG_2741 | Turn, late — outgoing a sliver, next page nearly full          | `book.tsx` turn                | 6c     |
| IMG_2742 | Settled — the turned-to page, full brightness                  | `book.tsx`                     | 6c     |
| IMG_2743 | "Background Dimming" menu open (High ✓ / Medium / Low / None)  | `book.tsx` guide menu          | 6b     |
| IMG_2744 | Line guide on, chrome hidden, guide disc bottom-start          | `book.tsx` guide, `reader.css` | 6b     |

---

## 1. Store page — top (IMG_2572)

### Reference

| Element         | Spec                                                                                                                                                                                                                                                                                                                                                                     | Tag                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Ground          | vertical gradient `#3c7d5a` (y 50) → `#2e6246` (y 616), monotonic; white body begins at **y 631**                                                                                                                                                                                                                                                                        | `[M]`                                                                  |
| Cover           | ≈ 211 pt wide, bottom edge at **y 297**, top runs under the status bar; 2:3 (≈ 316 tall); soft drop shadow ≈ `0 18px 40px rgba(0,0,0,.28)`                                                                                                                                                                                                                               | `[C]`, shadow `[U]`                                                    |
| ✕ close         | glass disc **44×44 at (16, 47)**; glyph ≈ 17 pt medium                                                                                                                                                                                                                                                                                                                   | `[M]`                                                                  |
| + ⋯ group       | one glass capsule **100×44 at x 274–374, y 47–91** (two 44-pt cells, ≈ 12 pt between glyph centres of 15 pt "+" and 18 pt "⋯")                                                                                                                                                                                                                                           | `[C]` size, `[M]` right edge/height                                    |
| Glass over tint | renders `#9eddc1` over `#3c7d5a` — a _lighten_ material, not white alpha: white ≈ 0.55 + `backdrop-filter: blur(20px) saturate(180%)`; rim as `.wa-glass-control`                                                                                                                                                                                                        | `[M]` colour, recipe `[U]`                                             |
| Eyebrow         | "APPLE BOOKS CLASSICS ›" **13 pt semibold**, uppercase, white, tracking ≈ 0; cap top y 330; chevron 10 pt; **underline 1 pt white/55 % (`#a7c0bb` on tint), full text width, 6 pt under the baseline**                                                                                                                                                                   | `[M]`                                                                  |
| Title           | **22 pt bold serif** (New York on device), white, centred, y 368–390                                                                                                                                                                                                                                                                                                     | `[M]`                                                                  |
| Author          | **17 pt regular**, white, "Jane Austen ›", y 401–413                                                                                                                                                                                                                                                                                                                     | `[M]`                                                                  |
| Rating line     | **15 pt**, mint `#b6f9e0` (≈ white 75 % tinted), "★ 3.4 (1.5k) • Fiction & Literature", y 436–448                                                                                                                                                                                                                                                                        | `[M]`                                                                  |
| Action card     | **326×129 at (32, 470)**, radius **20** (measured 18.7–19), fill white **16 %** over tint (`#49856a` on `#31694c`), padding 16                                                                                                                                                                                                                                           | `[M]`                                                                  |
| Card row 1      | "Book ⓘ" **17 pt semibold** white, ⓘ 15 pt at 60 %                                                                                                                                                                                                                                                                                                                       | `[M]`                                                                  |
| Card row 2      | "January 1813 • 490 Pages" **13 pt** mint `#cbfefa`                                                                                                                                                                                                                                                                                                                      | `[M]`                                                                  |
| Pills           | **Sample 143×50 at (48, 533)**, fill white 18 % (`#619d85`), white label 17 pt semibold + 16 pt book glyph; **Get 143×50 at (199, 533)**, white, label 17 pt semibold `#1c1c1e`; gap **8**; radius 25                                                                                                                                                                    | `[M]`                                                                  |
| Tab bar         | glass capsule **271×58 at (22, 765)**, radius 29; cells 50 tall with 4 pt padding; **selected cell 94×50 radius 25 `#ebebeb`**; bar renders `#fdfdfd` over white; icons **24 pt** (house.fill / books.vertical.fill / bag.fill); labels **10 pt medium**, all near-black (`#171717`–`#191919`); **search disc 58 at (310, 765)**, glyph 23 pt; gap bar→disc 16; floor 21 | `[M]` runs of exact colour; kit says 62 tall on a 402-wide frame `[K]` |

Chrome flip `[M]` 2573: once the tinted hero scrolls away, the same ✕ and + ⋯ controls render as
plain white glass over the white body — the material follows the content under it, so the chrome is
one element whose backdrop changes, never two variants.

### Current (`ours/13-book-detail-en-top.png`, `ours/11-…-ar-top.png`)

- Ground is the flat brand green `#00bc6d` with dark ink — a **documented decision** in
  `book-detail/hero.tsx` (white on that green measures ≈ 2.5:1). The reference is a cover-derived
  dark gradient with white ink. See §13 D1.
- No ✕ / + ⋯ glass chrome; the dashboard header ("Menu") stays above the panel. The reference has
  no app chrome at all: the page is a modal with its own close.
- Cover 160–192 pt wide (`w-40 sm:w-48`) — reference ≈ 211.
- Eyebrow 13 pt ✓, tracking `0.12em` — reference ≈ 0; underline 1 pt at 25 % — reference 55 %.
- Title `text-[30px] sm:text-4xl` bold sans — reference 22 pt serif. Author `text-lg` — reference 17.
- Card `rounded-[28px] p-5` — reference radius 20, padding 16; pills `h-14` (56) — reference 50;
  gap 12 — reference 8; labels "Read/Borrow" one word ✓.
- No tab bar. See §13 D2.

### Fixes (files)

1. `book-detail/hero.tsx`: cover width 211 (`w-[211px]` at phone, keep `sm:` cap), eyebrow
   tracking 0 + underline `border-[#fff]/55`, title 22 pt `font-serif` via `ui-serif` first
   (§11 T2), author 17, rating 15, card `rounded-[20px] p-4`, pills `h-[50px]` gap 8, card top at
   the measured 470 only if the ground becomes the gradient (D1).
2. New `book-detail/chrome.tsx` (client): the ✕ disc and the +/⋯ capsule as two `.wa-glass-control`
   instances (44 pt, from kit node 1:59), fixed at the safe-area top; ✕ = `router.back()`;
   the layout must hide the dashboard header on this route the way `HeroGate` hides the subject
   hero on `/textbook` (`data-immersive` already unpins it; add a `data-modal` flag that removes it).
3. Tab bar: only if D2 is accepted — reuse `messaging/mobile/ios-tabbar.tsx` geometry with the
   Books numbers above (271×58, cells 50, search disc 58).

Acceptance crop: `(0,0,1170,330)` header; `(60,1380,1110,1820)` card; `(0,2250,1170,2532)` bar.

---

## 2. Store page — below the fold (IMG_2573)

| Element          | Spec                                                                                                                                                                                | Tag                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Section headings | **18 pt bold serif** with a 15 pt `#8e8e93` chevron: "From the Publisher", "Customer Reviews ›", "Other Books in This Series ›"; left gutter **32**                                 | `[M]` cap 12.7 → 18; see note |
| Publisher body   | 17 pt regular, **`#000`** ink at rest (not grey), "…More" 17 pt semibold black inline; lines 24 apart                                                                               | `[M]`                         |
| Separators       | 1 px `#e5e5ea`, full width inside the 32 gutter, ≈ 28 pt above each heading                                                                                                         | `[M]`                         |
| Review card      | **326×122 at (32, 331)**, radius 16, fill `#f2f2f6`; title 17 semibold, body 15, ★★★★☆ 15 pt `#8e8e93` + date 13 pt                                                                 | `[M]` box, type `[C]`         |
| Series shelf     | covers **155×213 (≈ 2:2.75, the edition's own ratio)** at x 32 and 203 (gap 16), radius 4, page-edge highlight on the fore-edge; title 15 pt semibold under, author 15 pt `#8e8e93` | `[M]`                         |

Note on heading size: cap heights of 12.3–12.7 pt at cap ratio 0.70 give **17–18 pt**, not 22.
The 22 in the Figma kit is the sans Title 2; the serif headings here are set smaller. Use **18 pt
bold serif** for section headings and 22 only for the page title.

### Current (`ours/12-book-detail-ar-scrolled.png`)

- Column `max-w-xl px-6` ✓ (24 vs 32 gutter). Headings `text-xl font-bold` sans → 18 pt serif.
- About block is one clamped `<p>` with inline More — the reference opens a sheet (§5).
- No reviews (no backend — §12). Information list ✓ (reference has none on this page; keep it,
  it is the Books "Information" section from the page's own lower half).
- Shelves: `w-28 sm:w-32` covers with `line-clamp-2` titles — reference 155-wide covers, two per
  row on a phone, 15 pt titles.

Fixes: `book-detail/content.tsx` (gutter 32, section rule), `about.tsx` (§5), `book-shelf.tsx`
(cover 155×(ratio), gap 16, 15 pt type), `info-list.tsx` (rows 44 tall, label 15 `#8e8e93`,
value 15 `#000`).

Acceptance crop: `(0,250,1170,1000)` publisher block; `(0,1600,1170,2532)` shelf.

---

## 3. ⋯ context menu (IMG_2574) — not built

| Element       | Spec                                                                                                                                                                                                                                       | Tag                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Panel         | anchored under the ⋯ cell, right-aligned to it, ≈ **250 wide**, radius **34** (squircle 0.6), glass (white 0.70 _lighten_ + `#bfbfbf` 0.10 _darken_, backdrop blur), shadow `0 8 48 rgba(0,0,0,.25)` + 0.5 pt `#dbdbdb` rim; y 47 → ≈ 375  | `[K]` 22:707, `[M]` extent                                |
| Control group | three cells (Share / Sample / Want to Read) 73×56, radius 20; symbol **22 pt** over label **12 pt medium**, 5 pt apart; group padding 10, cell spacing 6; icon row y 60–97, labels y 97–121                                                | `[K]`, `[M]`                                              |
| Items         | 40 pt tall rows, 16 pt side inset; symbol 17 pt + label **17 pt regular** (tracking −0.43); "Add to Collection" (text.badge.plus), "Mark as Finished" (checkmark.circle), "Suggest More" (hand.thumbsup), "Suggest Less" (hand.thumbsdown) | `[K]`, `[M]` rows at y 166–182, 208–225, 270–288, 312–330 |
| Separators    | 1 pt `#e6e6e6` with 10 pt padding above and below, inset 8                                                                                                                                                                                 | `[K]`                                                     |
| Behaviour     | pops from the ⋯ cell with a spring (§11 M3); the page behind stays put; tap outside dismisses                                                                                                                                              | `[C]`                                                     |

Product mapping (§12): Share → `navigator.share`; Sample → open the reader in sample mode (only
when the book has a twin); Want to Read → favourites (`my-profile`); Add to Collection / Mark as
Finished / Suggest More/Less → **omit** (no backend). Build as `book-detail/more-menu.tsx` on top
of the existing Radix `DropdownMenu` with a custom content class `.books-glass-panel`.

Acceptance crop: `(380,140,1160,1080)`.

---

## 4. "Added" alert (IMG_2575) and the + → ✓ morph (IMG_2576) — alert BUILT 2026-09-13 as `book-detail/borrow-alert.tsx` for borrow/return (card re-measured: 250 wide, x 71–319, not 300); morph not built

| Element | Spec                                                                                                                                                                                 | Tag                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Alert   | centred card **300 wide** (x 45–345), ≈ 334 tall (y 255–589), radius ≈ 28, glass: white at the top, the page's green bleeding through at the foot (`#e6f0dd`) → white 0.85 + blur 30 | `[M]` width, `[C]` height/radius      |
| Icon    | checklist glyph (text.badge.checkmark) ≈ 56 pt, y 296–358                                                                                                                            | `[M]`                                 |
| Title   | "Added" **22 pt bold serif** at y 376–407                                                                                                                                            | `[M]`                                 |
| Body    | 17 pt regular black, centred, 4 lines 24 apart                                                                                                                                       | `[M]`                                 |
| Button  | "GOT IT" **17 pt semibold**, uppercase, tracking +0.04em, no separator, at y 581–617                                                                                                 | `[M]`                                 |
| Morph   | the "+" in the header capsule becomes "✓" (checkmark 17 pt) after Want to Read; the capsule keeps its size                                                                           | `[M]` 2576 glyph 33×29 → 17 pt symbol |

Product: the same alert confirms "added to Favourites"; drop the "and a sample was downloaded"
sentence unless the book has a twin. Build with the existing `AlertDialog` primitive + the glass
class; the + → ✓ is an `AnimatePresence` crossfade of two glyphs (§11 M4).

---

## 5. "From the Publisher" sheet (IMG_2577)

| Element | Spec                                                                                                                           | Tag                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| Sheet   | from **y 47** to the bottom, full width, top radius **38**, white; page behind dimmed black 20 % (`#cccccc` at the status bar) | `[M]`, radius `[K]` 20:476 |
| Close   | disc **44** at right inset 16, y 65–109, fill `#f2f2f6`, ✕ 17 pt `#8e8e93`                                                     | `[C]`                      |
| Title   | **22 pt bold serif**, centred, cap y 134–151                                                                                   | `[M]`                      |
| Rule    | **48×4**, radius 2, `#c5c5c7`, centred at y 189–193 (an ornament under the title, not a grabber)                               | `[M]`                      |
| Body    | **17 pt / 24**, `#8a8a8d` ink, gutter **20**, paragraph gap one line, italics for titles                                       | `[M]`                      |

Current: `about.tsx` clamps to 3 lines with an inline More/Less. Replace with: 3-line clamp +
"More" that opens this sheet (vaul `Drawer`, `.book-sheet-tall` 94svh already exists in
`reader.css` — reuse its class) with the full description + summary. Keep Less out: the sheet
closes instead.

Acceptance crop: `(0,100,1170,1200)`.

---

## 6. Reader page (IMG_2578, 2581–2583, 2595)

| Element                | Spec                                                                                                                                                                                                                                                                                                    | Tag                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Running head           | "Sample" **15 pt** `#8a8a8d`, centred, cap y 77–91 (centre 84)                                                                                                                                                                                                                                          | `[M]`                    |
| ✕ disc                 | **48** at right inset **34** (x 308–356), y 62–110, white glass, visible only by its shadow `0 2 10 rgba(0,0,0,.12)` — corrects the earlier 46/35: the solid red disc in IMG_2613 measures exactly 48×48 at x 308–356 and every reader disc shares that slot                                            | `[M]` 2613, halo `[M]`   |
| Chapter opener         | "Chapter 1" **36 pt bold serif** (C cap 25.3), centred, top y 139; ornament **105 wide × 10** (dark knot 80) at y 205–214; body starts y 231                                                                                                                                                            | `[M]`                    |
| Body (Latin)           | **20 pt serif / 24 line pitch** (1.2), paragraph indent **40** (2 em) _and_ a blank line between paragraphs; column x 60–348 in this capture (ragged right), 38–351 in IMG_2595 (justified, smaller size) → margins scale with size, ≈ **2 em**                                                         | `[M]`                    |
| Folio (chrome hidden)  | page number **15 pt** `#848488` centred at y ≈ 786; no ✕, no menu disc, no GET card                                                                                                                                                                                                                     | `[M]` 2581/2582          |
| Counter (chrome shown) | "1 of 77" 15 pt `#848488`, centre y 786                                                                                                                                                                                                                                                                 | `[M]`                    |
| Menu disc              | **48** at right inset 34, y 762–810; glyph two rules over three dots 23×18; centre y 786 = the counter's line                                                                                                                                                                                           | `[M]` 2613, glyph `[M]`  |
| GET card (sample mode) | **358×66 at (16, 684)** ±3, radius 33, white, shadow `0 10 30 rgba(0,0,0,.18)`; jacket **26×39** radius 2 at x 40; title **16 pt semibold** `#1c1c1e` at x 100; author **15 pt regular** `#1c1c1e`; **GET pill 58×28 black** at right inset 16, label 15 pt semibold white, small-caps tracking +0.02em | `[M]` (height `[C]`)     |
| Return chip            | after a jump, a chip "⟲ 18" (17 pt, 36×15 glyph+digits) at (35, 76) on the running-head line, tap returns to the previous folio                                                                                                                                                                         | `[M]` 2595               |
| Justified text         | IMG_2595 shows `text-align: justify` at the smaller size; keep `start` alignment for Arabic (justification stretches joins unless `text-justify: kashida` is honoured)                                                                                                                                  | `[M]`, Arabic rule `[U]` |

### Current (`ours/22-reader-page.png`, `28-reader-page-en.png`)

- Head 15 pt ✓ colour `--book-muted #8e8e93` ✓. ✕ / menu discs **46 at inset 35** (`reader.css` `2.875rem` / `2.1875rem`, `[P]`) → **48 at inset 34** (`[M]` 2613).
- Opener `h2` 1.9 em of 18 px = **34 px** ✓ (36 target); ornament `8.5em` = **153 px** → 105.
- Body `1.125rem` (18 px) at `--book-lh 1.9` (34 px pitch). Latin target 20/24; Arabic target
  20/34 (§11 T3). Margins `clamp(1.25rem, 6vw, 4rem)` = 23 px on a 390 → **40** (2 em).
- Paragraph `text-indent 1.5em; margin 0 0 0.6em` → indent 2 em + one blank line (Latin) / 0 indent
  - blank line (Arabic, where indents are not conventional) — decision D5.
- No GET/"sample" card, no return chip. The sample card is only meaningful when the reader is
  opened from the store page (§12 A2).

Fixes: `reader.css` (`.book-opener h2` 36 px, `.book-ornament` width 105 px, margins, leading
per language via `:lang(ar)`), `book.tsx` (return chip state: previous anchor after
`goToPage/goToElement/goToGlobal`, cleared on the next manual turn), new `sample-card.tsx`.

Acceptance crop: `(0,150,1170,700)` opener; `(0,2020,1170,2532)` foot.

---

## 6b. Line guide and background dimming (IMG_2610, IMG_2611)

| Element | Spec                                                                                                                                                                                                                                                                                                                  | Tag                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Guide   | ONE line lit: a white card **350 wide (x 20–370)**, ≈ 41 tall (the line's 27-pt glyph extent + 7 pt above and below), radius ≈ 8, shadow ≈ `0 2 8 rgba(0,0,0,.12)`; the line's ink stays `#000`                                                                                                                       | `[M]` extents, `[C]` radius/shadow  |
| Dimming | the rest of the page's TEXT is lightened, the paper stays white: High renders the ink at `#d7d7d7`; Medium / Low / None are the three other stops (values `[U]`, suggest ink at 16 % / 32 % / 55 % / 100 %)                                                                                                           | `[M]` High                          |
| Chrome  | hidden except the guide disc at the **bottom start** (48 at inset 34, glyph 23×19 — the mirror of the menu disc) and the folio "39" 15 pt centred                                                                                                                                                                     | `[M]`                               |
| Menu    | tapping the disc opens a glass panel **244×272 at (30, 530)**, radius 34 (kit context menu), bg `#f8f8f8`: header "Background Dimming" 13 pt `#8e8e93`, rows High ✓ / Medium / Low / None 17 pt with 42-pt pitch (y 591, 631, 674, 716), checkmark 17 pt at inset 20, separator, "Turn Off Line Guide" 17 pt at y 779 | `[C]` box, `[M]` rows, radius `[K]` |
| Motion  | the guide follows a drag on the page (finger down on the lit line moves it); which line lights on a tap is `[U]`                                                                                                                                                                                                      | `[U]`                               |

### Built (2026‑09‑20)

Rebuilt to the spec. The three-line black-42 % band is gone. Now: ONE line held clear in a
`.book-guide-lens` — a transparent rounded rect whose `box-shadow: 0 0 0 100vmax
color-mix(var(--book-bg) 84%, transparent)` paints the veil over everything but the capsule. A
veil in the **page's own bg colour** is why the measured dim works and needs no separate
paper/ink handling: white-veil over white paper is still white (255, measured), the same veil over
black ink lands at `0.84·255 ≈ 214` (215 measured) — one element, correct in every theme and in
dark mode (deepened to 88 %). The lens tracks the pointer on the compositor via `translateY` on
`--book-guide-y` (px). A `.book-guide-disc` (reusing `.book-round`, bottom **start**, mirrors under
RTL, sits above the veil at z 31) opens `.book-guide-menu` — a custom glass popover (not Radix, to
match `ReadingMenu`'s own pattern): title "Background Dimming", radio rows High ✓ / Medium / Low /
None, separator, "Turn Off Line Guide". The stop lives in a new `PREF.guideDim`
(`high|medium|low|none`, default high) as `data-guide-dim` on the root; `PREF.guide` stays the
on/off. Dim alphas: high 84 % `[M]`, medium 62 %, low 40 %, none 0 % (medium/low `[U]`).

Verified in-browser (sd-g12-biology, 390 pt): lens + disc render, the menu matches IMG_2743,
each stop changes `--book-guide-veil` (high→84 %, low→40 %, none→transparent), "Turn Off" clears
the guide, lens and disc.

Acceptance crops: `(0,150,1170,1400)` guide; `(40,1500,900,2450)` menu.

---

## 6c. Page turn (IMG_2739–2742)

The turn is a slide, not a curl. Advancing, the **current** page rides off toward the spine
**over** the next page, which waits just behind it — dimmed and slightly trailing — then brightens
in as it lands. Read off the four frames (390 pt, LTR Pride & Prejudice sample):

| Element        | Spec                                                                                                                                                             | Tag                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| Outgoing page  | on top, translates `0 → −100%` toward the spine (RTL: `→ +100%`); carries its own running head and folio                                                        | `[M]`                     |
| Incoming page  | beneath, offset **`17.4% × (1 − p)`** of width on the reveal side, `p` = the outgoing page's own progress — it starts 17.4 % behind and closes to 0              | `[M]` 204.2 / 203.0 px, two frames |
| Incoming dim   | luminance **`1 − 0.229 × (1 − p)`** — paper 196.6/255 at `p = 0`, rising to white. Modelled as `brightness(0.771 → 1)`                                          | `[M]` d/(1−p) = .2307 / .2288 / .2289 |
| Corner radius  | **48 pt** on the moving page — the display's own 47.33 pt corner; only its trailing corners are ever seen                                                        | `[M]` fit rms 2.2 px      |
| Edge shadow    | ≈ **4.5 % black over ~5 pt** at the leading edge, fading with `(1 − p)`; shipped flat at `0 0 6px rgba(0,0,0,.045)` — the fade is imperceptible and costs a repaint | `[M]` .045 / .033 / .017  |
| Folio          | travels with its page (44 on the outgoing, 45 on the incoming)                                                                                                  | `[M]`                     |
| Duration/curve | `0.36s`, `cubic-bezier(0.42, 0, 0.58, 1)` (UIKit's default easeInOut); exposed as `--book-turn-duration` / `--book-turn-ease`                                    | `[U]` — see below         |

**The captures fix position, never time.** The three in-flight frames are *positions* in the turn
(p = 0.099 / 0.315 / 0.606); nothing in them dates it — the file timestamps are copy times, out of
order, and no one takes three iPhone screenshots inside a ~350 ms animation. An earlier pass fitted
an easing curve to them by assuming the frames were evenly spaced in time and reported rms 0.04;
**that assumption is unfounded and the fit proves nothing.** What the frames DO fix, exactly and
redundantly, are the two laws above — each derived twice from independent frames, agreeing to
under 1 %. The curve is therefore chosen, not measured.

All four captures are the **next** (advance) turn; the **prev** turn is built as its symmetric
reverse (new page slides in over the old, old recedes and dims) — no capture, `[U]`.

### Built (2026‑09‑20)

Implemented with the **View Transitions API**, which leaves the engine, columns, markers and
search DOM untouched. `.book-stage` + running head + folio are wrapped in one **`.book-turn-page`**
— NOT `.book-page`, which is already the per-page article wrapper inside the flow (`article.tsx`);
reusing that name positioned all 107 pages of a chapter at `inset: 0`, stacked them on one spot and
collapsed the column pagination (the book reported 31 screens instead of 584 and the text rendered
as an unreadable pile). A tap/swipe/arrow next/prev runs through `turn()`, which sets
`data-book-turn` (`next`/`prev`) and `--book-turn-sign` (+1 LTR / −1 RTL) **on `<html>`** — the
pseudo-elements read their vars from the view-transition tree, a child of `:root`, not from `.book`
— then `startViewTransition(() => flushSync(run))`. Reduced-motion and unsupported browsers fall
back to the instant engine move; the track's own `transition` is killed under `data-vt` so the
incoming page never slides twice.

Four things the first cut got wrong, each found by measuring and each load-bearing:

1. **Two groups, not one image pair.** Chrome composites `::view-transition-old` *under*
   `::view-transition-new` inside a pair and **ignores `z-index` between them** — verified: the
   computed z-index really was 2 / 1 and the paint order did not change, so the leaving page sat
   beneath the arriving one. `turn()` therefore renames the element mid-transition —
   `book-leaf-out` at capture, `book-leaf-in` after the update — so each page lands in its own
   group, and **group** `z-index` does order them.
2. **The page must carry its own paper.** `.book-turn-page` had no background, so each snapshot was
   text on transparency and the two pages showed through each other. It now sets
   `background: var(--book-bg)` (the page colour otherwise lives on `.book`, which is captured in
   the *root* snapshot, not the page's).
3. **Suppress the root transition.** Nothing outside the page changes across a turn, so the UA's
   default root cross-fade is pure cost, and its `plus-lighter` blend ghosted the pages together.
   Frozen under `html[data-book-turn]`.
4. **The easing.** The front-loaded curves tried first read as a snap — 94 % of the travel spent in
   the first 45 % of the time, which is exactly the "not smooth" report. Replaced with UIKit's
   default `easeInOut`, `cubic-bezier(0.42, 0, 0.58, 1)`. A *choice*, tagged `[U]`: an intermediate
   pass claimed it was fitted to the captures, on an even-time-spacing assumption nothing supports.
5. **Both laws were mis-read, corrected 2026‑09‑20.** Parallax shipped at 12 % and the dim floor at
   `brightness(0.8)`. 12 % is the offset measured *in IMG_2740*, i.e. the value at `p = 0.315` — not
   the amplitude at `p = 0`, which is **17.4 %**; the turn was understating the parallax by ~45 %
   throughout. The dim floor is **0.771**. The 48 pt corner and the edge shadow were measured in the
   first pass and never implemented at all; both are in now.

Verified in-browser at 390 pt on `sd-g12-biology` (an Arabic book, so `meta.dir === "rtl"` and the
whole turn mirrors). A live turn sampled at five points, each checked against the measured laws
rather than against a single frame:

| p     | parallax | `17.4 %·(1−p)` | brightness | `1 − .229·(1−p)` |
| ----- | -------- | -------------- | ---------- | ---------------- |
| 0.056 | 16.42 %  | 16.42 %        | 0.784      | 0.784            |
| 0.194 | 14.02 %  | 14.02 %        | 0.816      | 0.816            |
| 0.405 | 10.35 %  | 10.35 %        | 0.864      | 0.864            |
| 0.664 | 5.85 %   | 5.85 %         | 0.923      | 0.923            |
| 0.871 | 2.25 %   | 2.25 %         | 0.970      | 0.970            |

The frame held at `p = 0.3145` is the mirror of IMG_2740. The leaving page is opaque and on top
with its 48 pt trailing corners, a clean seam and no ghosting; forward and back both run, a rapid
double-tap advances two pages, `prev` sets its own direction, and a turn leaves no
`data-book-turn`, sign or name behind.

## 7. Reading menu (IMG_2579, IMG_2595)

| Element        | Spec                                                                                                                                                                                                 | Tag           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Backdrop       | blur 24 px + white 35 % veil over the lower ≈ 45 % of the page, feathered upward (blurred text reads `#d8d8d8`–`#dddddd`)                                                                            | `[P]` + `[M]` |
| Column         | **273 wide at x 99–373** (right inset 17), pills **47 tall**, gap **5**, fully rounded                                                                                                               | `[M]`         |
| Contents pill  | dark `#37373b`, white label 17 pt "Contents • 0%", **list.bullet 24 pt** at right inset 21; the read fraction fills from the leading edge in `#e6e5ea` and inverts the label under it (36 % in 2595) | `[M]`         |
| Bookmarks pill | "Bookmarks & Highlights" + count "1" 17 pt, **only when count > 0**, sits between Contents and Search                                                                                                | `[M]` 2595    |
| Search pill    | light **`#e8e8ec`**, text 17 pt `#1c1c1e` at inset 17, magnifier **21 pt** at right inset 21                                                                                                         | `[M]`         |
| Themes pill    | text 17 pt, "AA" glyph 25×16 (A 14 + A 20)                                                                                                                                                           | `[M]`         |
| Round row      | four **64×47** capsules, gap 5: square.and.arrow.up (19×24), lock.rotation (31×28), line-guide (23×19), bookmark (15×23); ink `#1c1c1e`                                                              | `[M]`         |
| Counter        | stays visible 34 pt under the row                                                                                                                                                                    | `[P]`         |

### Current (`ours/23-reader-menu.png`)

Everything is present and in the right order. Deltas: pills `2.8125rem` (45) → **47**; light pill
`#e6e6e9` → `#e8e8ec`; icon `1.375rem` (22) → 24 for list.bullet, 21 for the magnifier; round
row `2.9375rem` (47) ✓; no Bookmarks pill (bookmarks live inside the Contents sheet today) →
add the pill when `bookmarks.length > 0`, opening the Contents sheet scrolled to its Bookmarks
heading. Motion: §11 M2.

Acceptance crop: `(280,1600,1170,2320)`.

### 7b. Bookmarks — indicator (IMG_2612, IMG_2613) and sheet (IMG_2614–2616)

| Element                   | Spec                                                                                                                                                                                                                                                                                         | Tag        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Confirmation              | the running head reads "Bookmark: Added" for a moment, 15 pt `#88878c` — the head line is the toast, not a floating pill                                                                                                                                                                     | `[M]` 2612 |
| Badge (chrome shown)      | a **24-pt red disc** (`#ff383c`, systemRed) with a white bookmark glyph pinned to the menu disc's top-end corner (centre ≈ (347, 771)) while the page is bookmarked                                                                                                                          | `[M]` 2612 |
| Indicator (chrome hidden) | the whole disc turns red: **48×48 at (308, 762)** `#ff3d40`, white bookmark glyph; the folio stays; nothing else shows                                                                                                                                                                       | `[M]` 2613 |
| Sheet                     | from y 47, full width, radius 38; header band white, body `#f5f5f5`; title 17 pt semibold centred (cap y 78–94); **start disc 48 white** with the select glyph (checklist) at inset 16; **end disc 48 black** with a white ✓ 20 pt at inset 16                                               | `[M]` 2614 |
| Segmented control         | capsule **360×36 at (17, 113)** fill `#f2f2f3` (≈ systemGray6); selected segment white **167×28 at (26, 119)** with a soft shadow; labels 15 pt (selected semibold black, other regular)                                                                                                     | `[M]` 2614 |
| Row                       | current-page bookmark in a capsule **376×71 at (7, 161)** `#dfdfdf` radius 20; chapter title 17 pt semibold at x 25 (cap y 180–196), "Today" 15 pt `#8e8e93` (y 204–217), folio 17 pt `#8e8e93` right-aligned at x 365                                                                       | `[M]` 2614 |
| Highlights tab            | empty state: "No Highlights or Notes" 22 pt serif `#838287` centred at y 431–452, body 17/22 `#8e8e93` centred in a 289-pt measure                                                                                                                                                           | `[M]` 2615 |
| Select mode               | start disc becomes ✕; rows lose the capsule and gain a 22-pt radio circle at x 20 with the title moved to x 65 and a 1-px `#d7d7d7` rule under; footer "Select Bookmarks" 17 pt `#8e8e93` centred on the counter line (y 786) and a **trash disc 48 white at (326, 762)** with a 21×24 glyph | `[M]` 2616 |

Product mapping: bookmarks exist (localStorage) → build the sheet with a single tab and no
segmented control until highlights exist (§12); the Bookmarks & Highlights pill (§7) opens it;
rows = chapter of the bookmarked page + date + printed folio; select mode deletes. The red
badge/disc and the head-line confirmation replace today's treatment (`30-reader-bookmarked.png`: the
round-row bookmark button inverts to black and a dark toast chip reads «أُضيفت الإشارة»).

Acceptance crops: `(0,2200,1170,2532)` indicator; `(0,130,1170,700)` sheet head.

---

## 8. Search sheet (IMG_2580) — built 2026-09-12

| Element | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                          | Tag                  |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Sheet   | from y 47, full width, radius **38** (a circle of r = 114 px fits the corner profile at every row), ground `#ffffff` in the capture — the product uses Abdout's `#fefeff`; **no grabber, no header ✕**                                                                                                                                                                                                                                        | `[M]`                |
| Title   | "Search Book" **17 pt semibold** black, centred; ink y 78–91 → centre **37 pt under the sheet edge**                                                                                                                                                                                                                                                                                                                                          | `[M]`                |
| Bar     | docked over the keyboard (keyboard top y 541): side insets **12**, field→disc gap **13**, **17** clear above and below the capsules                                                                                                                                                                                                                                                                                                           | `[M]`                |
| Field   | capsule **305×48 at (12, 476)** — glass, not a grey fill: interior `#fdfdfd`, a 1-px white rim, a soft shadow strongest below (`#f4f4f4` under the rim fading to `#f8f8f8` over 12 pt; `#f7`→`#fb` at the sides; almost nothing above); magnifier **16 pt** black 20 in from the field edge; placeholder "In this book" **17 pt regular `#717171`** starting 48 in; caret 23 tall `#c7c7c7`; mic **13×18** black ending 22 from the field end | `[M]`                |
| Close   | disc **48 at (330, 476)**, the same glass; ✕ **17 pt** `#191919`                                                                                                                                                                                                                                                                                                                                                                              | `[M]`                |
| Results | rows: matched line with the hit in bold, page number 13 pt grey; jump + highlight                                                                                                                                                                                                                                                                                                                                                             | `[U]` (not captured) |

**Correction (2026-09-12):** the first pass read the field as `#efeff0` 319×49 at (15, 491) and the
placeholder as `#5e5e5e`. Those came off the blurred keyboard band; the capsule is a 255 rim around a
253 fill, and re-measuring on that structure gives the rows above.

### Current (`ours/27-reader-search.png`, built 2026-09-12)

Built in `sheets.tsx` (`book-sheet-search`) + `reader.css`: radius 38 ✓ (corner profile within 1 px
of the reference at every row), ground `#fefeff` ✓ (`#1c1c1e` under `.dark`), title centre 37 under
the edge ✓, edge at 47 via `calc(100svh − 47px)` ✓, capsules 48 tall on 12 / 13 / 17 insets ✓, glass
fill + rim + shadow ✓, magnifier 16 at 20 ✓, placeholder 17 `#717171` ✓, ✕ 17 ✓; results rows
untouched (not captured). Mic drawn only where `SpeechRecognition` exists (Web Speech dictation,
`ar-SA` / `en-US`, stops when the sheet closes) — new `dictate` label in both dictionaries. **Not
verified:** the keyboard-docked bar on a real iPhone (emulation only, no on-screen keyboard).
IMG_2609 shows the same chrome under the Arabic keyboard; ours mirrors the bar under an RTL UI, which
is right for an Arabic interface (Apple's stays LTR only because that device runs in English).

---

## 9. Themes & Settings (IMG_2596)

| Element     | Spec                                                                                                                                                                                                                   | Tag                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Card        | inset **10** on all sides (x 10–380, y 355–834), radius **38** (concentric with the 47-pt screen corner), page behind dimmed black **13 %** (`#dededf`), no blur                                                       | `[M]`                                                                                                                                                      |
| Band        | frosted head from the card top to ≈ y 530: white ≈ 55 % + blur 30 (page text ghosts through at `#dcdcdc`–`#e1e1e1`)                                                                                                    | `[M]`                                                                                                                                                      |
| Title       | **22 pt bold** (T cap 16) at x 30 (card + 20), cap y 380–400                                                                                                                                                           | `[M]`                                                                                                                                                      |
| Close       | disc **44** at x 313–357, y 367–411, fill black 8 %, ✕ 17 pt `#8e8e93`                                                                                                                                                 | `[C]`                                                                                                                                                      |
| Capsules    | row at **y 425–473 (48 tall)**: A                                                                                                                                                                                      | A **190×48 at x 30**, divider 1×36 `#a4a4a6`, small A 17 pt / big A 23 pt; view capsule **130×48 at x 240–370**; fill black 10 % over the band (`#cbcbcd`) | `[M]` heights/widths, gap `[C]` 10–14 |
| View glyphs | left: a page with an arrow into brackets (layout/scroll toggle); right: sun.horizon (auto appearance). Semantics **`[U]`** — ours maps this capsule to light/dark, keep that                                           | `[C]`                                                                                                                                                      |
| Slider      | y 490–510: sun.min 16 pt at x 31, rail **6 pt `#d6d6d6`** x 59–337, fill `#1c1c1e` to the thumb, thumb **32×22** `#ececec` shadow `0 1 4 rgba(0,0,0,.2)`, sun.max 22 pt at x 344                                       | `[M]`                                                                                                                                                      |
| Body        | `#f6f6f6` from y ≈ 535; swatches **103×95**, gap 10, radius **24**, first row y 544; specimen "Aa" **30 pt serif** at the card's upper third, name **15 pt** 9 pt under; selected ring **3 pt black outside** the card | `[M]`                                                                                                                                                      |
| Swatches    | Original `#ffffff`/`#000`; Quiet `#4a494e`/`#ababb5`; Paper `#ededed`/`#1d1c1a`; Bold `#ffffff`/`#1b1b1b` (specimen bold); Calm `#eee2ca`/`#332a23`; Focus `#fffcf5`/`#1c1a12`                                         | `[M]`                                                                                                                                                      |
| Customize   | pill **330×48 at (30, 767)**, radius 24, fill `#e5e5e7`, gearshape 19 pt + "Customize" 17 pt semibold; card bottom padding 19                                                                                          | `[M]`/`[C]`                                                                                                                                                |

### Current (`ours/25-reader-settings.png`)

Structure ✓ (band + body, capsules, slider, 3×2 cards, Customize). Deltas: cards
`aspect-ratio 1/1` → **103:95**; radius `1.25rem` → 24; specimen `1.5rem` → 30 px; ring
`2.5px` → 3 px; Customize `3.25rem` (52) → 48; capsule fill `9 %` ✓; band `72 % + blur 30` ✓
(measured band is lighter than ours by ≈ 8 — set 60 %); Arabic cards drop the specimen and set
the name at 22 px `[P]` — keep (D4).

Acceptance crops: `(0,1040,1170,1560)` band; `(40,1600,1130,2532)` swatches.

---

## 10. Contents sheet (IMG_2598)

| Element     | Spec                                                                                                                                                                                                                                                               | Tag   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| Sheet       | from **y 47**, full width, `#f5f5f5`, radius 38; backdrop black 20 %                                                                                                                                                                                               | `[M]` |
| Head        | jacket **50×75** radius 3 at (25, 65) with `0 1 5 rgba(0,0,0,.22)`; title **17 pt semibold** `#000` at x 91; "Page 32 of 193" **15 pt** — "Page" `#8e8e93`, digits `#000`; close disc **48 white** at (326, 63), ✕ 17 pt `#8e8e93`, shadow `0 1 4 rgba(0,0,0,.08)` | `[M]` |
| Rows        | pitch **52**; title **15 pt semibold** `#000` at x 25; folio **15 pt** `#858489` right-aligned at x 356; separators 1 px `#d7d7d7`; rows past the sample: title `#8e8e93`, no folio                                                                                | `[M]` |
| Current row | capsule **376×50 at x 7**, radius **20**, fill `#dfdfdf`; the rules above and below it are dropped                                                                                                                                                                 | `[M]` |

### Current (`ours/24-reader-contents.png`)

Head title `1.375rem` (22) → **17**; folio `1.0625rem` → 15; jacket `3.25×4.5rem` (52×72) → 50×75;
rows `1.0625rem` (17) → 15 semibold, folios 15; capsule radius `0.875rem` (14) → 20; capsule
inset `calc(var(--toc-gutter) * -1)` with gutter 18 gives x 7 ✓; separators `rgba(0,0,0,.13)` ✓
(`#d7d7d7`); surface/current/close colours ✓ (`[P]`). Bookmarks heading below the list ✓ (not in
the capture; keep).

Acceptance crops: `(0,130,1170,480)` head; `(0,470,1170,1000)` rows.

---

## 11. Cross-cutting specs

### T — Type

| Role            | Reference (Latin, SF Pro / New York)                           | Ours, Latin                                                                                                    | Ours, Arabic                                                                                                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI face         | SF Pro (system)                                                | `--book-ui` = `-apple-system, BlinkMacSystemFont, system-ui, …` ✓ (`.font-ios-system` pattern — never ship SF) | same stack → SF Arabic on Apple, per `[P]` CDP measurement                                                                                                |
| Reading face    | New York                                                       | **`ui-serif` first** (= New York on Apple devices at zero bytes), then Thmanyah text, Georgia                  | Thmanyah text (ui-serif has no Arabic glyphs; per-glyph fallback keeps Latin words in New York inside Arabic books — acceptable, matches Books)           |
| Store title     | 22 bold serif                                                  | 22 / 28                                                                                                        | 22 / 34                                                                                                                                                   |
| Section heading | 18 bold serif                                                  | 18 / 24                                                                                                        | 18 / 30                                                                                                                                                   |
| Chapter opener  | 36 bold serif                                                  | 36 / 42                                                                                                        | 32 / 48 (Thmanyah's ascenders are tall; 36 collides with the running head on a 5-word title) `[U]`                                                        |
| Body (reader)   | 20 / 24, indent 2 em                                           | 20 / 24                                                                                                        | **20 / 34** (1.7) — Thmanyah needs ≥ 1.65 to keep diacritics off the line above; current 1.9 is loose. Line-spacing tight/normal/loose = 1.5 / 1.7 / 1.95 |
| Body (store)    | 17 / 24                                                        | 17 / 24                                                                                                        | 17 / 28                                                                                                                                                   |
| Labels          | 17 regular, tracking −0.43 `[K]`; 15 regular; 13 semibold caps | same sizes, tracking 0 on Arabic (cursive joins) `[P]`                                                         |                                                                                                                                                           |
| Tab labels      | 10 medium                                                      | 10 / 13                                                                                                        | 10 / 13                                                                                                                                                   |

Tracking for the SF sizes (HIG defaults): 17 → −0.43 `[K]`; 22 → +0.35, 15 → −0.23, 13 → −0.08,
12 → 0, 11 → +0.07 `[R]`… see §14 (HIG Typography page) — fill after fetch.

### C — Colour tokens (light)

| Token                    | Value                                                                                                                                                                 | Where                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `--books-ink`            | `#1c1c1e`                                                                                                                                                             | labels, pill text                                   |
| `--books-ink-2`          | `#8e8e93` (measured `#8a8a8d` / `#848488` / `#858489`)                                                                                                                | running head, counter, folios, "Page", placeholders |
| `--books-hairline`       | `#d7d7d7` (sheet), `#e5e5ea` (store), `#e6e6e6` (menu `[K]`)                                                                                                          | separators                                          |
| `--books-pill`           | `#e8e8ec`                                                                                                                                                             | menu pills, capsule cells                           |
| `--books-pill-dark`      | `#37373b`                                                                                                                                                             | Contents pill, toast                                |
| `--books-scrub-fill`     | `#e6e5ea`                                                                                                                                                             | read fraction                                       |
| `--books-sheet`          | `#f5f5f5`                                                                                                                                                             | contents sheet                                      |
| `--books-sheet-body`     | `#f6f6f6`                                                                                                                                                             | settings body                                       |
| `--books-current`        | `#dfdfdf`                                                                                                                                                             | current chapter capsule                             |
| `--books-field`          | `#efeff0`                                                                                                                                                             | search field, close discs on sheets                 |
| `--books-review`         | `#f2f2f6`                                                                                                                                                             | review card                                         |
| `--books-tab-selected`   | `#ebebeb`                                                                                                                                                             | selected tab cell                                   |
| `--books-dim-13` / `-20` | `rgba(0,0,0,.13)` / `.20`                                                                                                                                             | settings / contents+publisher backdrops             |
| Store tint               | `linear-gradient(#3c7d5a, #2e6246)` from the cover's dominant hue: `hsl(h 36% 36%) → hsl(h 36% 28%)` `[U]` formula; the reference values are for this one green cover | store page ground (D1)                              |

Dark values: reuse the reader's existing `[data-mode="dark"]` set (`#000` page, `#d9d9de` ink,
`rgba(44,44,46,.95)` pills) — the capture set is light-only, so dark stays `[U]` and follows
Apple's system greys (`#1c1c1e` grouped background, `#2c2c2e` secondary, `#8e8e93` label).

### G — Glass recipes (web approximations)

| Surface                               | Recipe                                                                                                                                                                                                                                                                   | Source                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Toolbar disc / capsule (store ✕, + ⋯) | `background: rgba(255,255,255,.55); backdrop-filter: blur(7px) saturate(180%); border: .5px solid rgba(255,255,255,.65); box-shadow: inset 1px 1px 1.5px rgba(255,255,255,.95), inset -1px -1px 1.5px rgba(0,0,0,.07), 0 8px 40px rgba(0,0,0,.12)` = `.wa-glass-control` | `[K]` 1:59, rendered `#9eddc1` on `#3c7d5a` `[M]` — tune alpha ±.05 until a PIL sample lands within ±6 |
| Tab bar                               | same with blur 20 = `.wa-glass-tabbar`                                                                                                                                                                                                                                   | `[K]` 5:596                                                                                            |
| Context menu / alert / sheet          | `rgba(255,255,255,.72) + blur(30px)`; shadow `0 8px 48px rgba(0,0,0,.25)`, rim `0 0 0 .5px #dbdbdb`; radius 34 (menu) / 38 (sheet)                                                                                                                                       | `[K]` 22:707, 20:476                                                                                   |
| Reader discs                          | `rgba(255,255,255,.84) + blur(12px)`, shadow `0 2 10 rgba(0,0,0,.12)`                                                                                                                                                                                                    | current, matches the near-invisible reference disc `[M]`                                               |
| Menu backdrop                         | `blur(24px)` + `color-mix(page 35%, transparent)`, `mask-image: linear-gradient(to top, black 30%, transparent 46%)`                                                                                                                                                     | `[P]` measured; **declare only the unprefixed `backdrop-filter`** (Lightning CSS gotcha `[P]`)         |

Squircle corner smoothing (`cornerSmoothing 0.6`) cannot be drawn in CSS; true refraction cannot
be done without SVG displacement maps and is not worth the paint cost on a text app. Both are
deliberate divergences.

### I — Icons (see §14 for the licence check)

SF Symbols must not be shipped in a web app (Apple's licence limits them to Apple-platform apps;
the PUA-codepoint trick through `-apple-system` is undocumented and shows tofu off Apple hardware).
Every glyph below therefore comes from an open set or is traced from the capture at its measured
size, masked through the existing `WaIcon` pattern (`mask-image` + `bg-current`) so it takes the
ink colour.

| Where         | Reference symbol                                                                                                                                             | Size (pt)            | Open equivalent                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------- |
| Tab bar       | house.fill, books.vertical.fill, bag.fill, magnifyingglass                                                                                                   | 24 / 23              | Framework7 Icons `house_fill`, `book_fill`… `[R]` §14                                         |
| Header        | xmark, plus, ellipsis, checkmark                                                                                                                             | 17                   | lucide `X`, `Plus`, `Ellipsis`, `Check` (already used)                                        |
| Store         | info.circle, star.fill, chevron.right, book.pages (Sample)                                                                                                   | 15 / 15 / 10 / 16    | lucide `Info`, `Star`, `ChevronRight`; `BookOpen` for Sample                                  |
| ⋯ menu        | square.and.arrow.up, book.pages, plus.circle.fill, text.badge.plus, checkmark.circle, hand.thumbsup, hand.thumbsdown                                         | 22 / 17              | lucide `Share`, `BookOpen`, `CirclePlus`, `ListPlus`, `CircleCheck`, `ThumbsUp`, `ThumbsDown` |
| Reader chrome | xmark; reading-menu glyph (two rules + three dots — **custom**, keep `MenuIcon`)                                                                             | 28 / 23×18           | existing                                                                                      |
| Menu          | list.bullet, magnifyingglass, textformat.size, square.and.arrow.up, lock.rotation (custom `RotationLockIcon`), line guide (custom `LineGuideIcon`), bookmark | 24 / 21 / 25×16 / 24 | existing lucide + custom ✓                                                                    |
| Settings      | textformat.size.smaller/larger (A A as text ✓), sun.min, sun.max, gearshape, (view capsule glyphs — `[U]`)                                                   | 16 / 22 / 19         | lucide `Sun`, `Settings` ✓                                                                    |
| Sheets        | xmark, mic.fill                                                                                                                                              | 17 / 18              | lucide `X`, `Mic` (only if speech is wired)                                                   |

### M — Motion

Reference behaviour observed in the captures and the app; timings are Apple's published spring
presets `[R]` (§14) expressed for Framer Motion, which takes the same `duration` + `bounce`
parameters:

| #   | Interaction                | Reference behaviour                                                                     | Web recipe                                                                                                                                |
| --- | -------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Page turn (slide)          | one screen slides, deceleration, no bounce                                              | `transform 0.28s cubic-bezier(.2,.7,.2,1)` ✓ current; on touch, drag follows the finger and releases with `spring{duration:.45,bounce:0}` |
| M2  | Reading menu open          | pills grow from the menu disc: scale .92→1 + fade, backdrop blur fades, ≈ 0.35 s snappy | `motion.div` `initial{scale:.92,opacity:0,transformOrigin:'bottom end'}` `spring{duration:.35,bounce:.15}`; backdrop `opacity .25s`       |
| M3  | Context menu / alert       | pop from the anchor, scale .9→1, snappy                                                 | `spring{duration:.35,bounce:.2}`, origin at the ⋯ cell                                                                                    |
| M4  | + → ✓                      | crossfade + slight scale                                                                | `AnimatePresence` 0.2 s                                                                                                                   |
| M5  | Sheets                     | slide up, smooth, ≈ 0.5 s, dim fades                                                    | vaul default (spring-like) — set `duration: 0.5` if exposed; dim `opacity .3s`                                                            |
| M6  | Chrome toggle (tap centre) | ✕ / menu / counter / card fade 0.25 s, head stays                                       | `opacity .25s ease` on `[data-chrome-visible]` (currently instant → add)                                                                  |
| M7  | Button press               | scale .96 + darken, 0.15 s, spring back                                                 | `.book-round:active` ✓ (0.94) — unify at 0.96                                                                                             |
| M8  | Tab selection              | selection pill slides between cells, snappy                                             | `layoutId` pill `spring{duration:.35,bounce:.15}` (only if D2)                                                                            |
| M9  | Scrub                      | page changes instantly under the finger (`instant`) ✓                                   | keep                                                                                                                                      |
| M10 | Theme change               | page recolours with a 0.2 s crossfade                                                   | `transition: background-color .2s, color .2s` on `.book`                                                                                  |
| M11 | Return chip                | appears after a jump, fades after the next turn                                         | `AnimatePresence`                                                                                                                         |

`prefers-reduced-motion`: keep M1's `transition: none` ✓ and reduce M2/M3/M5 to fades.

### D — Direction

Mirrors with `dir`: chevrons, pill order and text insets (logical properties ✓), the scrub fill's
leading edge ✓, the return chip's side, the menu column's end inset ✓, the settings capsules' order.
Stays physical: the jacket's spine crease and page-edge (`book-jacket.tsx` decision `[P]`), the
cover art, the tab-bar glyphs. The header capsule (+ ⋯) sits at the inline **end**; the ✕ at the
inline **start** (the reference is LTR: ✕ left, capsule right).

---

## 12. Reference action → product action

| Reference                                              | Ours                                                                          | Backend                                                         | Verdict                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Get                                                    | Borrow (`borrowBook`)                                                         | ✓                                                               | keep, label "Borrow"/"استعارة"                                                          |
| Sample                                                 | Read — opens the reader on the twin (`digitalFileUrl` today opens a raw file) | ✓ for subjects with a twin; ✗ for catalog books (no twin field) | **A2**: add `Book.twinKey` → schema, flag for Abdout; until then keep the disabled pill |
| Want to Read (+)                                       | Favourites                                                                    | ✗ no favourites table (`my-profile` = borrow history)           | needs schema → flag                                                                     |
| Share                                                  | `navigator.share` / clipboard                                                 | ✓                                                               | keep                                                                                    |
| Add to Collection, Mark as Finished, Suggest More/Less | —                                                                             | ✗                                                               | omit                                                                                    |
| Customer Reviews                                       | —                                                                             | ✗ (`rating` only, no count/reviews)                             | omit; keep "★ 4.2 · Genre"                                                              |
| Other Books in This Series                             | "More by author" + "You might also like" ✓                                    | ✓                                                               | keep                                                                                    |
| From the Publisher                                     | About this book (description + summary) ✓                                     | ✓                                                               | keep, sheet (§5)                                                                        |
| Reader GET card                                        | "Borrow" card in sample mode                                                  | ✓                                                               | only when opened from the store page                                                    |
| Bookmarks & Highlights                                 | Bookmarks ✓ (no highlights)                                                   | localStorage                                                    | keep; highlights out of scope                                                           |

---

## 13. Decisions for Abdout

- **D1 — Ground colour of the book page.** Reference: dark cover-derived gradient with white ink.
  Current: brand green `#00bc6d` with dark ink, chosen deliberately on 2026‑09‑09 (contrast).
  Mirroring the reference means: tint = cover's dominant hue at 36 % saturation, 36 → 28 %
  lightness (the `dominantTint()` sampler in `textbook/cover.tsx` already exists), white ink,
  and the green banner stays on `/library` only. Recommendation: **mirror the reference** — the
  green was a fix for arbitrary `coverColor` values, and a derived dark tint has the same
  guaranteed contrast as the reference.
- **D2 — Tab bar.** The reference tab bar is app navigation (Home / Library / Book Store /
  Search). The dashboard has a sidebar and a header; a floating tab bar only makes sense if the
  library becomes a phone-first "app inside the app" (`/library` = Home, `/library/books` =
  Library, search = the toolbar search). Recommendation: build it behind a `books-app` layout flag
  for phone widths only; skip on desktop.
- **D3 — Modal chrome.** The reference book page is a modal with ✕ and no app header. Doing the
  same needs the school-dashboard layout to hide its header on `/library/books/[id]` (a `data-modal`
  sibling of `data-immersive`). Recommendation: yes, phone widths only.
- **D4 — Arabic specimens.** Settings cards drop "Aa" and set the theme name at 22 px `[P]`.
  The reference has no Arabic capture. Keep.
- **D5 — Arabic paragraphs.** Latin: 2 em indent + blank line (reference). Arabic: no indent,
  blank line. Keep the current Arabic behaviour.
- **D6 — Schema.** Favourites (Want to Read) and a per-book twin key (Sample/Read) both need
  schema. Out of QA scope; listed, not built.

---

## 14. Research (sources) — filled in by this session, agents unavailable

> The three research agents (icons, motion, metrics) were terminated by the account's session
> limit at 2026‑09‑11 ~19:40 (resets 22:50 Africa/Khartoum). The entries below were fetched
> directly; anything not fetched is marked `[U]`.

### 14.1 Metrics, type and colour — Apple primary sources (agent report received 2026‑09‑11)

- **Fonts cannot be shipped.** Apple San Francisco Font License Agreement (EA1370) on
  <https://developer.apple.com/fonts/>: "You may not embed the Apple Font in any software programs
  or other products" and "You may not make the Apple Font available over a network". SF Arabic and
  New York sit behind the same gate. Consequence: system stacks only (`-apple-system`, `system-ui`,
  `ui-serif`); a licensed Arabic web face as the cross-platform fallback (the app already vendors
  Thmanyah; Noto Sans Arabic / IBM Plex Sans Arabic are the open alternatives). `[R]`
- **Dynamic Type, Large (default)** — HIG Typography, read from the live "Large" tab
  (<https://developer.apple.com/design/human-interface-guidelines/typography>): Large Title 34/41
  +0.40 · Title 1 28/34 +0.38 · Title 2 22/28 −0.26 · Title 3 20/25 −0.45 · Headline 17/22 −0.43
  semibold · Body 17/22 −0.43 · Callout 16/21 −0.31 · Subhead 15/20 −0.23 · Footnote 13/18 −0.08 ·
  Caption 1 12/16 0 · Caption 2 11/13 +0.06 (size/leading in pt, tracking in pt → `letter-spacing`
  px at 1x). This replaces the from-memory tracking line in §11 T. `[R]`
- **Arabic.** Apple publishes no separate Arabic scale; SF Arabic substitutes at the same sizes.
  The one numeric rule (HIG Right to left): Arabic next to uppercase Latin "often works well" about
  **2 pt larger** — apply to the 13 pt uppercase eyebrow's Arabic counterpart (15 pt, no uppercase).
  Numerals: Western or Eastern Arabic by locale; ours prints Latin digits in both languages (`[P]`
  messaging decision) — keep. `[R]`
- **Control sizes.** HIG Accessibility: **44×44 pt is the default control size, 28×28 the
  minimum**; ≈ 12 pt between bezeled controls, ≈ 24 pt between non-bezeled elements. The 44-pt
  discs and cells measured on the captures are the default size, not a minimum. `[R]`
- **Liquid Glass.** HIG Materials: Regular (adaptive, default) vs Clear (needs a dimming layer,
  media backgrounds only); small elements (tab bars, toolbars) flip light/dark with the content
  under them, large elements (menus, sheets) do not flip but grow more opaque; glass has no colour
  of its own and takes hue from what is behind it — which is exactly the `#9eddc1`-over-green
  reading in §1. HIG Toolbars: control radii are **concentric with the bar's corners**; WWDC25
  "Get to know the new design system": capsule radius = half the height, concentric radius =
  parent radius − padding (the 38-pt sheet inside the 47-pt screen corner at a 10-pt inset, §9).
  The current HIG no longer publishes iOS bar heights or the 16-pt margin — the kit redlines are
  the source for those; our numbers come from the captures. `[R]`
- **Books' type pattern confirmed:** section and navigation titles in a bold serif (New York),
  chrome in SF — the split §11 T mirrors. `[R]` (App Store and Apple Support screenshots)
- **Tab bar.** Books' selected tab renders monochrome black on the light glass cell, not a tint
  (agent sampled `(0,0,0)`; ours measured `#171717`). Storefronts with Audiobooks show four tabs +
  search; the captures show three (Home / Library / Book Store) + search — build for the
  captures. Library grid is **two columns** on iPhone (≈ 152-pt covers, 32-pt margin), not three. `[R]`
- **Product page field order** (books.apple.com, mirrors the app's content model): title,
  author, rating row "4.6 • 7.5K Ratings", price, publisher description, Apple Books Review,
  **Information: Genre, Released, Language, Length, Publisher, Seller, Size**, Customer Reviews,
  More Books Like This, More Books by [Author], Customers Also Bought. Our Information list
  (§2) keeps Publisher / Language / Pages / Published / ISBN / Availability — reorder to Genre,
  Published, Language, Pages, Publisher, ISBN, Availability. `[R]`
- **System colours (HIG Color, Specifications):** systemGray `#8E8E93` (both modes), Gray2
  `#AEAEB2`/`#636366`, Gray3 `#C7C7CC`/`#48484A`, Gray4 `#D1D1D6`/`#3A3A3C`, Gray5
  `#E5E5EA`/`#2C2C2E`, Gray6 `#F2F2F7`/`#1C1C1E`. Semantic label/background values are not
  published by Apple ("values may fluctuate"); community-measured: label `#000`/`#fff`,
  secondaryLabel `#3C3C43` @ 60 % / `#EBEBF5` @ 60 %, separator `#3C3C43` @ 29 % / `#545458`
  @ 60 %, systemBackground `#fff`/`#000`, secondarySystemBackground `#F2F2F7`/`#1C1C1E`,
  tertiary `#fff`/`#2C2C2E`. The captured greys (`#8a8a8d`, `#e5e5ea`, `#f2f2f6`, `#1c1c1e`) are
  these tokens with antialiasing — use the token names in code. Books' in-app accent is
  **unverified**; the captures use no accent at all (black selection, white pills). `[R]`
- Sources: HIG Typography · Color · Materials · Toolbars · Tab bars · Accessibility · Right to
  left · Dark Mode; <https://developer.apple.com/fonts/>; WWDC25 sessions 219 ("Meet Liquid
  Glass") and 356; <https://books.apple.com/us/book/atomic-habits/id1384286945>; third-party
  Figma recreation <https://www.figma.com/community/file/1374198742974468002/apple-books-ios>
  (not Apple's); community colour sheet <https://sarunw.com/posts/dark-color-cheat-sheet/>.

### 14.2 Icons and symbols (agent report received 2026‑09‑11)

- **Licence, verified from the primary text.** Xcode and Apple SDKs Agreement §2.10
  (<https://www.apple.com/legal/sla/docs/xcode.pdf>, p. 6): system-provided images and symbols
  "are licensed to You solely for the purpose of developing Applications for Apple-branded products
  that run on the system for which the image was provided". The Apple Design Resources licence
  (<https://developer.apple.com/support/downloads/terms/apple-design-resources/Apple-Design-Resources-License-20230621-English.pdf>)
  §2A/§2B limits the Figma kits to mock-ups for Apple-OS software and forbids "website content".
  Consequence: the kit is a **measuring instrument** for this blueprint, never an asset source; no
  SF Symbol glyph ships. `[R]`
- **Symbols confirmed on Apple's own App Store screenshots:** tab bar `house.fill`,
  `books.vertical.fill` (2,640 GitHub hits for Library tabs), `bag.fill`, `headphones` (storefronts
  with Audiobooks), `magnifyingglass` in a detached circle (SwiftUI `Tab(role: .search)` — the
  mechanism that pulls Search out of the pill, <https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/>);
  `ellipsis`, `xmark`, `chevron.right` (See All), `icloud.and.arrow.down` (download),
  `checkmark.circle.fill`; reader: A/A as text, `circle.lefthalf.filled` (appearance), `sun.min` /
  `sun.max`, **`gearshape.fill`** for Customize (not the older `gear`). HIG standard icons:
  `person.crop.circle` (Account), `square.and.arrow.up` (Share). Unverified for Books: `star.fill`,
  the sort/list-grid toggle, the page-turn-style glyph. `[R]`
- **Tab-bar icon grid** (HIG Tab bars, regular size class): circle 25×25, square 23×23, wide 31,
  tall 28 pt; "prefer filled symbols" — consistent with the 24-pt extents measured in §1. `[R]`
- **RTL.** `chevron.forward` mirrors, `chevron.right` does not — our `rtl:rotate-180` on the
  chevrons is the web equivalent; house / books / bag / search / xmark / checkmark / gear / sun /
  list / bookmark do not mirror. `[R]`
- **Open sets, licence-ranked.** Lucide (ISC, independently drawn — the codebase's set) is the
  safest and covers the whole map: `house`, `library` (true side-by-side spines), `shopping-bag`,
  `search`, `circle-user`, `circle-ellipsis`/`ellipsis`, `x`, `share`, `chevron-right`,
  `cloud-download`, `circle-check`, `bookmark`, `star`, `list`, `a-large-small`, `contrast`
  (appearance), `sun-dim`/`sun`, `settings`, `airplay`, `mic`. Phosphor (MIT), Iconoir (MIT),
  Tabler (MIT) are equivalent alternatives. **Framework7 Icons** (MIT) carries 21 of the 23 names
  checked (`house_fill`, `book_fill`, `bag_fill`, `search`, `xmark`, `plus`, `ellipsis`,
  `square_arrow_up`, `list_bullet`, `textformat_size`, `lock_rotation`, `bookmark`, `sun_min`,
  `sun_max`, `hand_thumbsup`, `hand_thumbsdown`, `checkmark_circle`, `text_badge_plus`,
  `info_circle`, `star_fill`, `chevron_right`, `mic_fill`; no `checkmark_alt`, no `gear_alt` and
  **no `gearshape`**) but its taxonomy is SF Symbols' own, which makes it the legally hotter choice
  for an explicit Apple clone. Decision: **Lucide + traced customs** (reading-menu glyph, rotation
  lock, line guide, spine-stack library glyph if `library` reads too thin at 24 pt). `[R]`
- **Clones on GitHub:** none targets the iOS 26 chrome. Useful for behaviour only:
  <https://github.com/kishikawakatsumi/BookReader> (MIT, page-turn / TOC / search / bookmarks),
  <https://github.com/krsna24/ShelfAI> (2025 SwiftUI, exact symbol names; no licence). Apple's
  kits: <https://www.figma.com/community/file/1527721578857867021/ios-and-ipados-26> and the iOS 27
  successor <https://www.figma.com/community/file/1651309003795292092/ios-and-ipados-27>. `[R]`

### 14.3 Motion and interaction sources (agent report received 2026‑09‑11)

- **Springs, from Apple's `Spring` docs** (<https://developer.apple.com/documentation/swiftui/spring>):
  `Spring(duration: 0.5, bounce: 0.3)` = mass 1, stiffness 157.9, damping 17.6 (Apple's own worked
  example); presets `.smooth` = duration 0.5 / bounce 0, `.snappy` = 0.5 / 0.15, `.bouncy` =
  0.5 / 0.3 (each preset's doc page states its base bounce); bounce 0 = critically damped,
  bounce 1 = undamped, so damping ratio ζ = 1 − bounce; stiffness = (2π/duration)², damping =
  2ζ√stiffness → **smooth {157.9, 25.1}, snappy {157.9, 21.4}, bouncy {157.9, 17.6}**, legacy
  `.spring(response .5, dampingFraction .825)` = {157.9, 20.7}. Framer Motion's spring accepts
  `duration` + `bounce` (<https://motion.dev/docs/react-transitions>) but its perceptual-duration
  semantics are not documented as identical, so **pass the explicit `{type:"spring", mass:1,
stiffness, damping}` triples** in `springs.ts`. CSS: `ease` = Core Animation's default curve
  (0.25,0.1,0.25,1), `ease-in-out` = `easeInEaseOut`; for spring-shaped CSS use `linear()` from
  <https://www.kvin.me/css-springs> (takes duration + bounce). This replaces the duration/bounce
  shorthand in §11 M. `[R]`
- **What is scroll-linked, not timed:** the large-title collapse and the iOS 26 tab-bar minimise
  (`tabBarMinimizeBehavior(.onScrollDown)`) follow the scroll offset 1:1 — build them with
  `animation-timeline: scroll()` (Safari 26+) or `useScroll` + `useTransform`, never a spring. No
  Apple timing exists for the tab-bar shrink; none of the captures shows it mid-motion. `[R]`
- **Page-turn modes:** Curl / Slide / None, user-selectable since iOS 16.4; the captures cannot show
  which was on; ours is Slide. `page-flip` (StPageFlip, MIT, <https://github.com/Nodlik/StPageFlip>)
  if Curl is ever wanted; **turn.js is non-commercial-only** — its licence text forbids commercial
  use, so it is out. `[R]`
- **Glass on the web:** `backdrop-filter: url(#displacement)` is unsupported in Safari and Firefox
  (WebKit bug 245510), i.e. on the very device being mirrored — SVG-refraction libraries
  (<https://github.com/rdev/liquid-glass-react>, <https://github.com/shuding/liquid-glass>) render
  flat there. Keep blur + saturate + rim (§11 G); squircle corners via `figma-squircle` /
  `html-squircle` clip-paths are available if the 34/38-pt panels ever need the continuous curve
  (`corner-shape: squircle` is Chromium-only). Haptics: `navigator.vibrate()` is not implemented in
  iOS Safari — no substitute. `[R]`
- **Behaviours the agent confirmed from the captures** (already specified above): the header
  buttons re-tint from glass-on-green to white once the hero scrolls away (IMG_2572 vs 2573 — add
  to §1: the chrome's material follows the content under it, the Liquid Glass "flip"); Want to
  Read = centred modal + persistent + → ✓ (§4); "More" = full sheet (§5); the reader chrome toggles
  on tap (§6); the search field is bottom-anchored above the keyboard (§8); six themes (§9);
  unreached chapters dimmed in Contents (§10); Line Guide with Background Dimming High / Medium /
  Low / None (§6b); Bookmarks & Highlights with a segmented control and Select-to-delete (§7b).
  Cover press-scale, the Home card, the Library grid's motion and pull-to-refresh have **no
  source** — cover press feedback is a design decision (M7), and Books shows no pull-to-refresh, so
  none is built. `[R]`
- **Currency:** iOS 27 ships 2026‑09‑14 and reportedly folds the search tab back into the bar in
  several Apple apps (<https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/>);
  Books is not named. The captures are the contract; re-capture after the update before touching
  the tab bar (D2). `[R]`

---

## 15. Findings while measuring (defects, not opinions)

1. **The cover screen swallows every click.** `cover.tsx` puts `data-chrome` on
   `.book-cover-art`, and `onStageClick` returns early for any `[data-chrome]` target — the art
   covers the whole stage, so mouse users cannot leave the cover by tapping the edge zones;
   only keys and touch-swipe work. Playwright reproduced it: three edge clicks, no turn; one
   `ArrowDown`, one turn. Fix: drop `data-chrome` from the art and keep it on the plate only.
2. Contents-sheet head is 22/17 where the reference is 17/15 semibold; rows 17 vs 15 (§10).
3. Theme cards are square; the reference is 103×95 (§9). Customize is 52 tall vs 48.
4. Ornament is 153 px wide vs the reference's 105 (§6).
5. `about.tsx` inline More vs the reference's full sheet (§5).
6. `book-video.tsx` prints a hardcoded "Book Preview" heading — dictionary rule violation
   (`.claude/rules/translation.md`); not in any capture, fix in passing.
7. The welcome "Quick Guide" dialog opens over the book page on a fresh session and blocks the
   first tap — pre-existing dashboard behaviour, but it is the first thing a phone user meets.

---

## 16. Implementation plan

Phased so each phase ships on `main` alone and is verifiable with the harness in §17.

**Phase A — atoms (½ day).** `src/components/atom/books/`: `glass.css` (`.books-glass-control`,
`.books-glass-panel`, `.books-sheet`), `springs.ts` (M-table presets), `books-icon.tsx`
(masked SVG set, licence header), `sample-card.tsx`, `return-chip.tsx`. Import the messaging
glass tokens rather than duplicating them.

**Phase B — reader metrics (½ day).** `reader.css` numbers from §6–§10 (opener 36, ornament
105, margins 2 em, Latin 20/24 + Arabic 20/34, pills 47, contents 17/15/15, cards 103:95 r24,
Customize 48, field `#efeff0`, discs 48 at inset 34), `cover.tsx` fix (§15.1), `sheets.tsx`
Bookmarks pill + the Bookmarks sheet (§7b) + the red bookmark badge/disc, the one-line guide with
its dimming menu (§6b), M6 fade,
M2 spring. Touch drag for M1 in `book.tsx` (`touchmove` → `translateX` follow, release → spring).

**Phase C — store page (1 day).** D1 tint, `chrome.tsx` (✕, + ⋯), `more-menu.tsx` (§3),
`added-alert.tsx` (§4), publisher sheet (§5), metrics from §1–§2, `data-modal` in the
school-dashboard layout, favourites stub disabled until D6.

**Phase D — connect the halves (½ day, after D6).** Sample/Read opens `BookReader` in sample mode
with the GET card → Borrow; return chip; `/library/books/[id]` gets its own loading skeleton
matching the new geometry.

**Phase E — tab bar (½ day, only if D2).** `books-tabbar.tsx` from `ios-tabbar.tsx` with the §1
numbers, phone-only layout flag, M8.

**Phase F — records.** Both blocks' `README.md` / `ISSUE.md` / `CLAUDE.md`, `content/docs-en/library.mdx`,
`content/docs-en/catalog.mdx` (reader section), and the GitHub issue for the block.

---

## 17. Verification harness

`scripts/books-mirror-capture.mjs` (Playwright, `@playwright/test`'s chromium) logs in on
`demo.localhost:3000` as the demo admin (role picker → «دخول», welcome dialog dismissed), renders
each screen at **390×844, deviceScaleFactor 3, isMobile, hasTouch**, and writes
`.claude/screenshots/books-mirror/<screen>.png` — the same pixel grid as the captures.
`scripts/books-mirror-crops.py` cuts the acceptance rectangles listed per section from both the
reference and ours into `crops/`, and prints the sampled colours for the token table so a drift
shows up as a number, not an impression.

Rules learned the hard way `[P]`: crop **both** to the same rectangle and read them side by side;
thresholding the reference alone catches the page text behind the glass and lies; a 3x capture
next to a 1x render looks washed out where it is only antialiasing; prove a blur renders by the
std-dev of a text band, not by eye.

Acceptance: every crop pair reads the same at 0.5 scale, every sampled colour within ±6 per
channel, every measured box within ±2 pt, in both `ar` and `en`, light and dark, at 390 and at
1440 (desktop keeps the phone's centred column, as the reader already does).

---

## 18. Production checklist

- [ ] Every string in `dictionaries/{ar,en}/library.json` or `school-{en,ar}.json` (`subjects.catalog.reader`); no hardcoded English (`book-video.tsx` today)
- [ ] RTL: logical properties everywhere except the jacket; chevrons `rtl:rotate-180`; return chip at the inline start
- [ ] Dark mode: all new tokens defined in `.dark`; the store tint keeps white ink in both
- [ ] `prefers-reduced-motion` on M1–M8
- [ ] a11y: menus `role="menu"`, sheets `DrawerTitle`, discs `aria-label`, focus visible on glass (2 px ring `--primary/40`)
- [ ] Performance: no layout on page turn (transform only ✓), masked icons cached, `backdrop-filter` only on the visible surfaces
- [ ] Tests: `textbook-parse.test.ts` untouched; add a Playwright spec that runs the harness screens and asserts the boxes (not pixels)
- [ ] `pnpm tsc --noEmit` clean; records updated (Phase F)
- [ ] No SF Symbols, SF Pro, New York or SF Arabic files in the repo; fonts by system stack only

---

## 19. Out of scope / no reference

- `/library` home (green banner, film still, rows) — no Books capture of Home; leave as is.
- `/subjects/[slug]` page — no capture; the reader is entered from it, nothing to mirror.
- Highlights, collections, reviews, Book Store commerce.
- Page-curl mode (Books offers Slide / Curl / None; the captures cannot show which was on; ours is Slide — keep; `page-flip` (StPageFlip, MIT) is the library if Curl is ever wanted `[R]` §14).
