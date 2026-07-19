import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import {
  createLegacyManifestEntry,
  discoverSource,
  generatePhotoAssets,
  isGeneratedImage,
  isSourceEntryCurrent,
  readManifest,
  readSafeExifDefaults,
  writeManifestAtomic,
} from "./image-pipeline/core.mjs";

const root = path.join(process.cwd(), "public/photos");
const manifestPath = path.join(process.cwd(), "src/generated/photos.json");
const args = process.argv.slice(2).filter((argument) => argument !== "--");
const force = args.includes("--force");
const verbose = args.includes("--verbose");
const slugs = args.filter((argument) => !argument.startsWith("--"));

if (slugs.length > 1) {
  console.error("Usage: pnpm images:build -- [slug] [--force] [--verbose]");
  process.exit(1);
}

await mkdir(root, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

const folders = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
const selected = slugs[0]
  ? folders.filter((slug) => slug === slugs[0])
  : folders;

if (slugs[0] && selected.length === 0) {
  console.error(
    `[${slugs[0]}] Photo folder not found at public/photos/${slugs[0]}/.`,
  );
  process.exit(1);
}

const manifest = await readManifest(manifestPath);
let manifestChanged = false;
const summary = {
  processed: 0,
  metadataUpdated: 0,
  skipped: 0,
  warnings: 0,
  failed: 0,
};

for (const slug of selected) {
  const directory = path.join(root, slug);
  try {
    const files = await readdir(directory);
    const source = discoverSource(files, slug);

    if (!source) {
      const hasGeneratedAssets = files.some(isGeneratedImage);
      summary.warnings += 1;
      if (hasGeneratedAssets) {
        console.warn(
          `[${slug}] No source.* original found; keeping existing generated assets unchanged. Add the original to regenerate this photograph.`,
        );
        if (!manifest[slug]) {
          const legacyEntry = await createLegacyManifestEntry(directory, slug);
          if (legacyEntry) {
            manifest[slug] = legacyEntry;
            manifestChanged = true;
          }
        }
      } else {
        console.warn(
          `[${slug}] No source image found. Add source.jpg (or another supported source format) before building images.`,
        );
      }
      continue;
    }

    if (
      !force &&
      (await isSourceEntryCurrent(directory, manifest[slug], source))
    ) {
      const exif = await readSafeExifDefaults(
        path.join(directory, source.fileName),
      );
      const previousExif = manifest[slug].exif;
      if (
        JSON.stringify(previousExif ?? null) !== JSON.stringify(exif ?? null)
      ) {
        const refreshed = { ...manifest[slug] };
        if (exif) refreshed.exif = exif;
        else delete refreshed.exif;
        manifest[slug] = refreshed;
        manifestChanged = true;
        summary.metadataUpdated += 1;
        console.log(`[${slug}] Refreshed safe EXIF metadata.`);
      }
      summary.skipped += 1;
      if (verbose) console.log(`[${slug}] Unchanged.`);
      continue;
    }

    manifest[slug] = await generatePhotoAssets({ directory, slug, source });
    manifestChanged = true;
    summary.processed += 1;
    console.log(
      `[${slug}] Generated responsive WebP assets from ${source.fileName}${source.legacy ? " (legacy source name)" : ""}.`,
    );
  } catch (error) {
    summary.failed += 1;
    console.error(
      error instanceof Error ? error.message : `[${slug}] ${String(error)}`,
    );
  }
}

if (manifestChanged) await writeManifestAtomic(manifestPath, manifest);

console.log("");
console.log(`Processed: ${summary.processed}`);
console.log(`Metadata refreshed: ${summary.metadataUpdated}`);
console.log(`Skipped unchanged: ${summary.skipped}`);
console.log(`Warnings: ${summary.warnings}`);
console.log(`Failed: ${summary.failed}`);

if (summary.failed > 0) process.exitCode = 1;
