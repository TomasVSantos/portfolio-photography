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
src/content/photos/culatra-farol/page.mdx
public/photos/culatra-farol/source.jpeg
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
seriesOrder: 10 # optional; controls order only within its series
---
```

Camera and lens are optional editorial overrides. The pipeline extracts only a
sanitized EXIF capture timestamp for chronological sorting; it does not publish
raw EXIF. GPS, serial numbers, owner names, and software history are never copied
to the public manifest. Alt text always remains human-authored.

`draft: true` allows incomplete work to exist without an image manifest entry.
Drafts are excluded from production gallery, search, series, sitemap, and photo
navigation. Incomplete non-drafts fail validation.

The gallery, homepage selections, search index, and global photo navigation sort
by the sanitized EXIF capture timestamp, newest first, regardless of when a
photograph was added to the repository. The editorial `date` and then slug are
deterministic fallbacks when capture time is unavailable. Within a series,
optional `seriesOrder` values come first in ascending order; photographs without
one fall back to capture time, date, and slug.

### Current collection

The repository currently publishes eight source-backed photographs in the
Culatra series. Each entry includes its full-resolution `source.jpeg`, generated
responsive WebPs, editorial MDX, and a current manifest record. Running
`pnpm images:check` verifies all eight without legacy warnings.

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

`category` accepts `documentary`, `street`, `travel`, `concert`, `music`,
`portrait`, `landscape`, or `other`. `venue` is optional.

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
- Cloudflare Pages project: `portfolio`

`wrangler.toml` records the Pages project and output directory. All photo and
series routes are produced at build time with `generateStaticParams`.

Pushes to `main` deploy through `.github/workflows/deploy.yml`. The GitHub
repository must define `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as
Actions secrets. The token needs Cloudflare Pages edit permission for the
account that owns the `portfolio` project. No application runtime secrets are
required by this static site.

## Photography collection

The public portfolio currently contains eight photographs from Culatra, ordered
chronologically from 17–19 July 2026. New photographs can be added through the
same source-backed workflow without changing application routes or components.
