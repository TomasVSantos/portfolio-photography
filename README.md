# Tomás Santos Photography

A static-first photography portfolio built with Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

## Adding a photograph

Every photograph has a content folder and a public image folder with the same slug:

```text
src/content/photos/culatra-lighthouse/page.mdx
public/photos/culatra-lighthouse/image.webp
```

The MDX frontmatter is the source of truth for routing, series, metadata, image dimensions, blur colour, and display text. The body is rendered as the photo story. Adding the folder automatically adds the photograph to the gallery, series route, sitemap, and previous/next sequence.

Required frontmatter:

```yaml
---
title: Lighthouse
location: Culatra, Portugal
camera: iPhone 17 Pro
lens: 26mm equivalent
date: 2026-07-18
series: Culatra
featured: true
tags: [lighthouse, sea, algarve]
image: image.webp
width: 1122
height: 1402
color: "#aeb2ae"
alt: A white lighthouse beyond sand dunes
---
```

## Architecture

- `src/app` — static routes, dynamic photo/series routes, metadata, robots, and sitemap
- `src/components/layout` — shared exhibition shell, navigation, footer, and page containers
- `src/components/photo` — cards, lightbox, navigation, and sharing
- `src/content/photos` — file-based MDX photo records
- `src/lib/photos.ts` — typed content index and automatic series generation
- `src/lib/images.ts` — image-provider boundary used by every frontend surface
- `public/photos` — current local image storage, including responsive WebP variants

The frontend never constructs a storage URL directly. `getPhotoImage()` is the sole image rendering boundary, so an R2 provider can replace the local provider without changes to cards, galleries, photo pages, or metadata generation. Run `pnpm images:build` after adding a source PNG to generate the responsive WebP set.

## Cloudflare Pages

The app uses native Next.js static export and does not require a Node runtime at the edge.

- Build command: `pnpm build:cf`
- Build output directory: `out`
- Node version: `20` or newer

`wrangler.toml` records the Pages output directory. All photo and series routes are produced at build time with `generateStaticParams`.

## Sample imagery

The repository includes six generated editorial photographs so every layout and interaction is production-testable. Replace the matching source image, run `pnpm images:build`, and update its MDX metadata when original work is ready.
