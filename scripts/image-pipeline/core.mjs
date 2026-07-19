import { createHash } from "node:crypto";
import {
  access,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { imagePipelineConfig, pipelineSignature } from "./config.mjs";

const GENERATED_IMAGE_PATTERN = /^image(?:-\d+)?\.webp$/i;
const SOURCE_FILE_PATTERN = /^source\.[^.]+$/i;

export class ImagePipelineError extends Error {
  constructor(slug, message) {
    super(`[${slug}] ${message}`);
    this.name = "ImagePipelineError";
  }
}

export function isGeneratedImage(fileName) {
  return GENERATED_IMAGE_PATTERN.test(fileName);
}

export function discoverSource(files, slug) {
  const candidates = files
    .filter((file) => SOURCE_FILE_PATTERN.test(file))
    .sort((a, b) => a.localeCompare(b));

  if (candidates.length > 1) {
    throw new ImagePipelineError(
      slug,
      `Multiple source files found: ${candidates.join(", ")}. Keep exactly one source.* file.`,
    );
  }

  if (candidates.length === 1) {
    const candidate = candidates[0];
    const extension = path.extname(candidate).toLowerCase();
    if (!imagePipelineConfig.supportedSourceExtensions.includes(extension)) {
      throw new ImagePipelineError(
        slug,
        `Unsupported source format "${extension || candidate}". Export JPEG, PNG, WebP, TIFF, or AVIF first.`,
      );
    }
    return { fileName: candidate, legacy: false };
  }

  if (files.includes("image.png")) {
    return { fileName: "image.png", legacy: true };
  }

  return null;
}

export function getExpectedGeneratedFiles() {
  return [
    "image.webp",
    ...imagePipelineConfig.widths.map((width) => `image-${width}.webp`),
  ];
}

export async function hashFile(filePath) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function getOrientedDimensions(metadata, slug) {
  if (!metadata.width || !metadata.height) {
    throw new ImagePipelineError(
      slug,
      "Source image has no readable dimensions.",
    );
  }
  const swapsAxes = [5, 6, 7, 8].includes(metadata.orientation ?? 1);
  return swapsAxes
    ? { width: metadata.height, height: metadata.width }
    : { width: metadata.width, height: metadata.height };
}

function getOrientation(width, height) {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

function toHex(value) {
  return Math.round(value).toString(16).padStart(2, "0");
}

async function getDerivedVisualData(input) {
  const [stats, blurBuffer] = await Promise.all([
    sharp(input).rotate().stats(),
    sharp(input)
      .rotate()
      .resize({
        width: imagePipelineConfig.blurWidth,
        withoutEnlargement: true,
      })
      .blur(1.2)
      .webp({ quality: imagePipelineConfig.quality.blur, effort: 3 })
      .toBuffer(),
  ]);
  const { r, g, b } = stats.dominant;
  return {
    dominantColor: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
    blurDataURL: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
  };
}

function scaledHeight(sourceWidth, sourceHeight, outputWidth) {
  return Math.max(1, Math.round((sourceHeight / sourceWidth) * outputWidth));
}

function temporaryPath(directory, fileName) {
  return path.join(
    directory,
    `.${fileName}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`,
  );
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function outputsAreCurrent(directory, entry) {
  const expected = [
    entry.fallback,
    ...entry.variants.map((item) => item.src),
  ].map((src) => path.basename(src));
  return (
    expected.length === getExpectedGeneratedFiles().length &&
    (
      await Promise.all(
        expected.map((name) => fileExists(path.join(directory, name))),
      )
    ).every(Boolean)
  );
}

export async function isSourceEntryCurrent(directory, entry, source) {
  if (!entry || entry.legacy) return false;
  if (entry.pipelineSignature !== pipelineSignature) return false;
  if (entry.source !== source.fileName) return false;
  if (
    entry.sourceHash !== (await hashFile(path.join(directory, source.fileName)))
  ) {
    return false;
  }
  return outputsAreCurrent(directory, entry);
}

export async function generatePhotoAssets({ directory, slug, source }) {
  const sourcePath = path.join(directory, source.fileName);
  const [metadata, sourceHash, visual] = await Promise.all([
    sharp(sourcePath).metadata(),
    hashFile(sourcePath),
    getDerivedVisualData(sourcePath),
  ]);
  const dimensions = getOrientedDimensions(metadata, slug);
  const outputs = [
    {
      fileName: "image.webp",
      requestedWidth: imagePipelineConfig.canonicalMaxWidth,
      quality: imagePipelineConfig.quality.canonical,
    },
    ...imagePipelineConfig.widths.map((width) => ({
      fileName: `image-${width}.webp`,
      requestedWidth: width,
      quality: imagePipelineConfig.quality.variant,
    })),
  ];
  const temporaryFiles = outputs.map((output) => ({
    ...output,
    temporary: temporaryPath(directory, output.fileName),
  }));

  try {
    await Promise.all(
      temporaryFiles.map((output) =>
        sharp(sourcePath)
          .rotate()
          .resize({ width: output.requestedWidth, withoutEnlargement: true })
          .webp({ quality: output.quality, effort: 5 })
          .toFile(output.temporary),
      ),
    );
  } catch (error) {
    await Promise.all(
      temporaryFiles.map((output) => rm(output.temporary, { force: true })),
    );
    throw error;
  }

  for (const output of temporaryFiles) {
    await rename(output.temporary, path.join(directory, output.fileName));
  }

  const expectedNames = new Set(outputs.map((output) => output.fileName));
  const stale = (await readdir(directory)).filter(
    (file) => isGeneratedImage(file) && !expectedNames.has(file),
  );
  await Promise.all(stale.map((file) => rm(path.join(directory, file))));

  const fallbackWidth = Math.min(
    dimensions.width,
    imagePipelineConfig.canonicalMaxWidth,
  );
  return {
    source: source.fileName,
    sourceHash,
    pipelineSignature,
    legacy: false,
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: Number((dimensions.width / dimensions.height).toFixed(6)),
    orientation: getOrientation(dimensions.width, dimensions.height),
    dominantColor: visual.dominantColor,
    blurDataURL: visual.blurDataURL,
    variants: imagePipelineConfig.widths.map((requestedWidth) => {
      const outputWidth = Math.min(dimensions.width, requestedWidth);
      return {
        width: requestedWidth,
        outputWidth,
        height: scaledHeight(dimensions.width, dimensions.height, outputWidth),
        src: `/photos/${slug}/image-${requestedWidth}.webp`,
      };
    }),
    fallback: `/photos/${slug}/image.webp`,
    fallbackWidth,
    fallbackHeight: scaledHeight(
      dimensions.width,
      dimensions.height,
      fallbackWidth,
    ),
  };
}

export async function createLegacyManifestEntry(directory, slug) {
  const fallbackPath = path.join(directory, "image.webp");
  if (!(await fileExists(fallbackPath))) return null;

  const [metadata, visual, files] = await Promise.all([
    sharp(fallbackPath).metadata(),
    getDerivedVisualData(fallbackPath),
    readdir(directory),
  ]);
  const dimensions = getOrientedDimensions(metadata, slug);
  const variants = [];
  for (const fileName of files.sort((a, b) => a.localeCompare(b))) {
    const match = /^image-(\d+)\.webp$/i.exec(fileName);
    if (!match) continue;
    const variantMetadata = await sharp(
      path.join(directory, fileName),
    ).metadata();
    if (!variantMetadata.width || !variantMetadata.height) continue;
    variants.push({
      width: Number(match[1]),
      outputWidth: variantMetadata.width,
      height: variantMetadata.height,
      src: `/photos/${slug}/${fileName}`,
    });
  }

  return {
    source: null,
    sourceHash: null,
    pipelineSignature: null,
    legacy: true,
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: Number((dimensions.width / dimensions.height).toFixed(6)),
    orientation: getOrientation(dimensions.width, dimensions.height),
    dominantColor: visual.dominantColor,
    blurDataURL: visual.blurDataURL,
    variants,
    fallback: `/photos/${slug}/image.webp`,
    fallbackWidth: dimensions.width,
    fallbackHeight: dimensions.height,
  };
}

export async function readManifest(manifestPath) {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT")
      return {};
    throw error;
  }
}

export async function writeManifestAtomic(manifestPath, manifest) {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  const temporary = temporaryPath(
    path.dirname(manifestPath),
    path.basename(manifestPath),
  );
  await writeFile(temporary, `${JSON.stringify(sorted, null, 2)}\n`);
  await rename(temporary, manifestPath);
}
