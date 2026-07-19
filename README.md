# Tomás Santos Photography

A static-first photography portfolio built with Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.

## Commands

```bash
pnpm install
pnpm dev
pnpm photo:new
pnpm images:build
pnpm images:check
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm build
```

## Publishing photographs

Every photograph keeps editorial content and image assets in matching slug
folders:

```text
src/content/photos/culatra-lighthouse/page.mdx
public/photos/culatra-lighthouse/source.jpg
```

The MDX file contains human decisions; `src/generated/photos.json` contains
machine-derived image data. A published photograph is automatically included in
the gallery, search, series pages, sitemap, and previous/next sequence.

### Add a photograph

1. Run `pnpm photo:new` and answer the prompts. For automation, arguments are
   also supported, for example:

   ```bash
   pnpm photo:new -- --slug under-the-lights --title "Under the Lights" --date 2026-06-20 --location "Lisbon, Portugal" --series "Live Music" --category concert --tags "concert,live music" --alt "A performer beneath white stage lights"
   ```

2. Put the original in `public/photos/<slug>/` using a stable source name such
   as `source.jpg`.
3. Run `pnpm images:build -- <slug>`.
4. Refine the MDX metadata and story, then remove `draft: true`.
5. Run:

   ```bash
   pnpm images:check
   pnpm typecheck
   pnpm lint
   pnpm build
   ```

### Replace a photograph

1. Replace its single `source.<extension>` file.
2. Run `pnpm images:build -- <slug>`.
3. Review the alt text and any editorial metadata affected by the replacement.
4. Run the verification commands above.

Use `pnpm images:build -- <slug> --force` to regenerate unchanged input. Running
`pnpm images:build` without a slug checks the full collection and processes only
sources whose content hash or pipeline configuration changed.

### Source and generated files

Supported source names are `source.jpg`, `source.jpeg`, `source.png`,
`source.webp`, `source.tif`, `source.tiff`, and `source.avif`. The installed Sharp
build handles these formats reliably. HEIC/HEIF is intentionally rejected; export
JPEG, TIFF, or PNG first. The legacy name `image.png` remains supported and can
be migrated with:

```bash
mv public/photos/<slug>/image.png public/photos/<slug>/source.png
pnpm images:build -- <slug> --force
```

The generator never selects `image.webp`, `image-*.webp`, placeholders, or
other arbitrary files as a source. Multiple `source.*` files are an error.

Generated derivatives use photographic WebP quality 86 for the canonical
`image.webp` and 82 for responsive variants. The configured requested widths are
256, 384, 480, 768, 1024, 1200, 1536, 1600, and 2400 pixels. The first four
legacy widths are retained so existing public URLs continue to work. Images are
never enlarged; a requested-width filename may contain a smaller image when the
original is narrower.

Generation uses temporary files and only replaces public derivatives after all
new files have completed. Obsolete `image-<width>.webp` files are removed after
a successful generation, while source and unrelated files are preserved.

`src/generated/photos.json` records source dimensions, aspect ratio,
orientation, dominant colour, a compact blur data URL, variant paths and sizes,
the source SHA-256 hash, and the pipeline configuration signature. Do not edit
this file manually. `pnpm images:check` detects stale hashes, missing variants,
invalid MDX, and orphaned manifest entries. Application and Cloudflare builds run
this check but do not process originals.

Source originals, generated derivatives, and the generated manifest are committed
to Git in the current repository policy. This keeps local and CI validation
reproducible; the image-provider boundary still allows originals or derivatives
to move to R2 later.

### Editorial metadata

Published photographs require the following human-authored frontmatter:

```yaml
---
title: Lighthouse
location: Culatra, Portugal
camera: iPhone 17 Pro
lens: 26mm equivalent
date: 2026-07-18
series: Culatra
category: travel
venue: MEO Arena # optional
featured: true
tags: [lighthouse, sea, algarve]
alt: A white lighthouse beyond sand dunes
order: 10 # optional
---
```

Camera and lens are optional editorial overrides. The data model permits safe
EXIF-derived defaults, but the current pipeline deliberately does not publish raw
EXIF. GPS, serial numbers, owner names, and software history are never copied to
the public manifest. Alt text always remains human-authored.

`draft: true` allows incomplete work to exist without an image manifest entry.
Drafts are excluded from production gallery, search, series, sitemap, and photo
navigation. Incomplete non-drafts fail validation.

Portfolio order is deterministic: explicit `order` values come first in ascending
order, followed by date descending, then slug ascending for ties. The same order
feeds galleries, series, featured selections, and previous/next navigation.

### Existing generated-only photographs

The six original sample folders contain generated WebPs but no recoverable source
originals. They have been preserved as explicit legacy entries in the manifest;
`images:build` skips them safely and `images:check` reports a warning rather than
corrupting their assets. To complete their migration, add the true original as
`source.<extension>` and run `pnpm images:build -- <slug>`. Do not rename
`image.webp` into a source file.

## Architecture

- `src/app` — static routes, dynamic photo/series routes, metadata, robots, and sitemap
- `src/components/layout` — shared exhibition shell, navigation, footer, and page containers
- `src/components/photo` — cards, lightbox, navigation, and sharing
- `src/content/photos` — file-based MDX photo records
- `src/lib/photos.ts` — typed content index and automatic series generation
- `src/lib/search-index.ts` — build-time search records for photos, series, and pages
- `src/lib/search.ts` — client-safe search normalization and ranking
- `src/lib/gallery-filter.ts` — shareable URL-filter matching
- `src/lib/images.ts` — manifest-backed image-provider boundary used by every frontend surface
- `src/generated/photos.json` — generated technical image metadata
- `scripts/image-pipeline` — source discovery and atomic responsive generation
- `public/photos` — current local image storage, including responsive WebP variants

The frontend never constructs a storage URL directly. `getPhotoImage()` is the sole image rendering boundary, so an R2 provider can replace the local provider without changes to cards, galleries, photo pages, or metadata generation.

### Categories and series metadata

`category` accepts `documentary`, `street`, `travel`, `concert`, `music`, `portrait`, or `other`. `venue` is optional.

A series is generated automatically from photo frontmatter. Optional editorial metadata can be added without changing any photo:

```text
src/content/series/live-music.mdx
```

```yaml
---
title: Live Music
slug: live-music
description: Performers, crowds, venues, and the atmosphere around the stage.
category: concert
---
```

### Search and gallery discovery

The build emits `/search-index.json` from the MDX content. The command palette and index are loaded only when search is invoked, keeping the initial page bundle small. Search scoring lives in `src/lib/search.ts` and is independent of the interface so the index can grow without changing the palette.

Gallery filters are client-side and represented in the URL:

```text
/gallery?series=culatra
/gallery?category=concert
/gallery?year=2026
/gallery?location=lisbon
/gallery?tag=live-music
```

Filtering logic is isolated in `src/lib/gallery-filter.ts`; no database or runtime filesystem access is required.

## Cloudflare Pages

The app uses native Next.js static export and does not require a Node runtime at the edge.

- Build command: `pnpm build:cf`
- Build output directory: `out`
- Node version: `20` or newer

`wrangler.toml` records the Pages output directory. All photo and series routes are produced at build time with `generateStaticParams`.

## Sample imagery

The repository includes six generated editorial photographs so every layout and interaction is production-testable. Add the matching original source when available, run `pnpm images:build -- <slug>`, and update editorial MDX only where the real photograph requires it.
