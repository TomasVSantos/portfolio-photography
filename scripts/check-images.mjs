import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { pipelineSignature } from "./image-pipeline/config.mjs";
import {
  discoverSource,
  getExpectedGeneratedFiles,
  hashFile,
  isGeneratedImage,
  readManifest,
} from "./image-pipeline/core.mjs";
import { validateEditorialData } from "../src/lib/photo-editorial.mjs";

const photosRoot = path.join(process.cwd(), "public/photos");
const contentRoot = path.join(process.cwd(), "src/content/photos");
const manifestPath = path.join(process.cwd(), "src/generated/photos.json");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const errors = [];
const warnings = [];
const manifest = await readManifest(manifestPath);
const contentFolders = (await readdir(contentRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
const publicFolders = (await readdir(photosRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
const contentSet = new Set(contentFolders);
const publicSet = new Set(publicFolders);

for (const slug of publicFolders) {
  if (!contentSet.has(slug)) {
    errors.push(
      `[${slug}] Public photo folder has no matching src/content/photos/${slug}/page.mdx.`,
    );
  }
}

for (const slug of contentFolders) {
  const mdxPath = path.join(contentRoot, slug, "page.mdx");
  if (!(await exists(mdxPath))) {
    errors.push(`[${slug}] Missing page.mdx.`);
    continue;
  }
  const { data } = matter(await readFile(mdxPath, "utf8"));
  const editorial = validateEditorialData(data, slug);
  errors.push(...editorial.errors);
  if (editorial.draft) continue;

  if (!publicSet.has(slug)) {
    errors.push(`[${slug}] Missing public/photos/${slug}/ folder.`);
    continue;
  }
  const entry = manifest[slug];
  if (!entry) {
    errors.push(`[${slug}] Missing generated image manifest entry.`);
    continue;
  }
  if (entry.fallback !== `/photos/${slug}/image.webp`) {
    errors.push(
      `[${slug}] Manifest fallback does not resolve to the canonical image.webp URL.`,
    );
  }

  const directory = path.join(photosRoot, slug);
  const files = await readdir(directory);
  let source;
  try {
    source = discoverSource(files, slug);
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : `[${slug}] ${String(error)}`,
    );
    continue;
  }

  if (source) {
    const currentHash = await hashFile(path.join(directory, source.fileName));
    if (entry.sourceHash !== currentHash || entry.source !== source.fileName) {
      errors.push(`[${slug}] Source image changed after generation.`);
    }
    if (entry.pipelineSignature !== pipelineSignature) {
      errors.push(
        `[${slug}] Image pipeline configuration changed after generation.`,
      );
    }
    const expected = new Set(getExpectedGeneratedFiles());
    const generated = files.filter(isGeneratedImage);
    for (const file of expected) {
      if (!generated.includes(file))
        errors.push(`[${slug}] Missing generated asset: ${file}`);
    }
    for (const file of generated) {
      if (!expected.has(file))
        errors.push(`[${slug}] Stale generated asset: ${file}`);
    }
  } else {
    const generated = files.filter(isGeneratedImage);
    if (generated.length === 0) {
      errors.push(`[${slug}] No source image or generated assets found.`);
    } else if (!entry.legacy) {
      errors.push(
        `[${slug}] Source image is missing for a source-backed manifest entry.`,
      );
    } else {
      warnings.push(
        `[${slug}] Generated-only legacy photograph cannot be hash-validated until an original source.* file is added.`,
      );
    }
  }

  for (const publicPath of [
    entry.fallback,
    ...entry.variants.map((variant) => variant.src),
  ]) {
    const fileName = path.basename(publicPath);
    if (!(await exists(path.join(directory, fileName)))) {
      errors.push(`[${slug}] Manifest references missing asset: ${fileName}`);
    }
  }
}

for (const slug of Object.keys(manifest)) {
  if (!contentSet.has(slug))
    errors.push(`[${slug}] Orphaned generated manifest entry.`);
}

for (const warning of warnings) console.warn(warning);
for (const error of errors) console.error(error);
console.log(`Checked: ${contentFolders.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failed: ${errors.length}`);

if (errors.length > 0) {
  const staleSlugs = [
    ...new Set(
      errors.map((error) => /^\[([^\]]+)\]/.exec(error)?.[1]).filter(Boolean),
    ),
  ];
  const hint = staleSlugs.length === 1 ? ` -- ${staleSlugs[0]}` : "";
  console.error(
    `Image assets are stale. Run pnpm images:build --${hint} and commit the generated outputs.`,
  );
  process.exitCode = 1;
}
