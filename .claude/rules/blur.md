---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/*.tsx"
---

# Blur-up Image Rules

A photo that pops out of an empty box reads as slow even when it isn't. Every content photo
(catalog, cover, hero, gallery, card media, avatar larger than ~48 px) renders through
`BlurImage` from `@/components/atom/blur-image`, which paints a blurred LQIP and transitions
the real image from `blur-xl scale-105` to `blur-0 scale-100` on load.

## Good

```tsx
import { BlurImage } from "@/components/atom/blur-image"

;<div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
  <BlurImage
    src={book.coverUrl}
    alt={book.title}
    fill
    sizes="(max-width: 768px) 50vw, 20vw"
    className="object-cover"
  />
</div>
```

## Bad

```tsx
<img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />

// or: placeholder="blur" alone — swaps abruptly, never sharpens
<Image src={url} placeholder="blur" blurDataURL={SHIMMER} fill alt="" />
```

## Fix

Swap the import to `BlurImage`, keep every prop (`fill`, `sizes`, `priority`, `unoptimized`),
give the parent `relative overflow-hidden bg-muted` and an aspect ratio, and pass a stored
`blurDataURL` when the row has one. Logos and icons under ~48 px use `plain` (fade only).

Exempt: SVG icons, `blob:`/`data:` upload previews, messaging bubbles, email/print/PDF/
certificate/invoice views, and shadcn `AvatarImage` (its fallback is the loading state).

## Never

- `opacity-0` on a blur-mode image — next/image paints the LQIP as the `<img>` background.
- Fetch-and-downscale an LQIP at request time — generate it at upload or in a backfill script.
- A neutral blur on the LCP hero — give it a real LQIP (static import or stored).

> kun skill: `blur` · card: `kun/.claude/patterns/cards/blur.md`
