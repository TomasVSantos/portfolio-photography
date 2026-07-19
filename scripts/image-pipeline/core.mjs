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
const EXIF_HEADER = "Exif\0\0";

function createTiffReader(exif) {
  if (!Buffer.isBuffer(exif) || exif.length < 8) return null;
  const tiffStart =
    exif.subarray(0, 6).toString("binary") === EXIF_HEADER ? 6 : 0;
  if (tiffStart + 8 > exif.length) return null;

  const byteOrder = exif.subarray(tiffStart, tiffStart + 2).toString("ascii");
  const littleEndian = byteOrder === "II";
  if (!littleEndian && byteOrder !== "MM") return null;

  function inBounds(offset, length) {
    return offset >= 0 && length >= 0 && offset + length <= exif.length;
  }

  function uint16(offset) {
    if (!inBounds(offset, 2)) return null;
    return littleEndian ? exif.readUInt16LE(offset) : exif.readUInt16BE(offset);
  }

  function uint32(offset) {
    if (!inBounds(offset, 4)) return null;
    return littleEndian ? exif.readUInt32LE(offset) : exif.readUInt32BE(offset);
  }

  if (uint16(tiffStart + 2) !== 42) return null;

  function readIfd(relativeOffset) {
    const offset = tiffStart + relativeOffset;
    const declaredCount = uint16(offset);
    if (declaredCount === null) return new Map();
    const availableCount = Math.max(
      0,
      Math.floor((exif.length - (offset + 2)) / 12),
    );
    const count = Math.min(declaredCount, availableCount);
    const entries = new Map();

    for (let index = 0; index < count; index += 1) {
      const entryOffset = offset + 2 + index * 12;
      const tag = uint16(entryOffset);
      const type = uint16(entryOffset + 2);
      const valueCount = uint32(entryOffset + 4);
      if (tag === null || type === null || valueCount === null) continue;
      entries.set(tag, {
        type,
        count: valueCount,
        valueOffset: entryOffset + 8,
      });
    }
    return entries;
  }

  function readLong(entry) {
    if (!entry || entry.type !== 4 || entry.count < 1) return null;
    return uint32(entry.valueOffset);
  }

  function readAscii(entry) {
    if (!entry || entry.type !== 2 || entry.count < 1) return null;
    const byteLength = entry.count;
    const relativeOffset = byteLength <= 4 ? null : uint32(entry.valueOffset);
    if (byteLength > 4 && relativeOffset === null) return null;
    const offset =
      byteLength <= 4 ? entry.valueOffset : tiffStart + relativeOffset;
    if (!inBounds(offset, byteLength)) return null;
    return exif
      .subarray(offset, offset + byteLength)
      .toString("ascii")
      .replace(/\0.*$/s, "")
      .trim();
  }

  return { readIfd, readLong, readAscii, uint32, tiffStart };
}

export function extractCaptureDate(exif) {
  const reader = createTiffReader(exif);
  if (!reader) return undefined;

  const ifd0Offset = reader.uint32(reader.tiffStart + 4);
  if (ifd0Offset === null) return undefined;
  const ifd0 = reader.readIfd(ifd0Offset);
  const exifIfdOffset = reader.readLong(ifd0.get(0x8769));
  const exifIfd =
    exifIfdOffset === null ? new Map() : reader.readIfd(exifIfdOffset);
  const rawDate =
    reader.readAscii(exifIfd.get(0x9003)) ??
    reader.readAscii(exifIfd.get(0x9004)) ??
    reader.readAscii(ifd0.get(0x0132));
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(
    rawDate ?? "",
  );
  if (!match) return undefined;

  const [, year, month, day, hour, minute, second] = match;
  const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const date = new Date(`${normalized}Z`);
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 19) !== normalized
  ) {
    return undefined;
  }
  return normalized;
}

function safeExifDefaults(metadata) {
  const captureDate = extractCaptureDate(metadata.exif);
  return captureDate ? { captureDate } : undefined;
}

export async function readSafeExifDefaults(input) {
  return safeExifDefaults(await sharp(input).metadata());
}

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
  const exif = safeExifDefaults(metadata);
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
    ...(exif ? { exif } : {}),
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
