import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { imagePipelineConfig } from "../scripts/image-pipeline/config.mjs";
import {
  discoverSource,
  extractCaptureDate,
  generatePhotoAssets,
  getExpectedGeneratedFiles,
  isSourceEntryCurrent,
  readManifest,
  writeManifestAtomic,
} from "../scripts/image-pipeline/core.mjs";

const temporaryDirectories: string[] = [];

function exifFixture(captureDate: string) {
  const exif = Buffer.alloc(70);
  exif.write("Exif\0\0", 0, "binary");
  exif.write("II", 6, "ascii");
  exif.writeUInt16LE(42, 8);
  exif.writeUInt32LE(8, 10);

  const ifd0 = 14;
  exif.writeUInt16LE(1, ifd0);
  exif.writeUInt16LE(0x8769, ifd0 + 2);
  exif.writeUInt16LE(4, ifd0 + 4);
  exif.writeUInt32LE(1, ifd0 + 6);
  exif.writeUInt32LE(26, ifd0 + 10);

  const exifIfd = 32;
  exif.writeUInt16LE(1, exifIfd);
  exif.writeUInt16LE(0x9003, exifIfd + 2);
  exif.writeUInt16LE(2, exifIfd + 4);
  exif.writeUInt32LE(20, exifIfd + 6);
  exif.writeUInt32LE(44, exifIfd + 10);
  exif.write(`${captureDate}\0`, 50, "ascii");
  return exif;
}

async function fixtureDirectory() {
  const directory = await mkdtemp(path.join(tmpdir(), "photo-pipeline-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function createImage(
  filePath: string,
  { width = 900, height = 600, color = "#867b70" } = {},
) {
  await sharp({
    create: { width, height, channels: 3, background: color },
  })
    .jpeg({ quality: 92 })
    .toFile(filePath);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("image source discovery", () => {
  it("finds one supported source.* file", () => {
    expect(discoverSource(["source.jpg", "image.webp"], "frame")).toEqual({
      fileName: "source.jpg",
      legacy: false,
    });
  });

  it("supports legacy image.png without treating generated WebPs as sources", () => {
    expect(discoverSource(["image.png", "image.webp"], "frame")).toEqual({
      fileName: "image.png",
      legacy: true,
    });
    expect(
      discoverSource(["image.webp", "image-480.webp", "blur.webp"], "frame"),
    ).toBeNull();
  });

  it("rejects multiple source candidates with their names", () => {
    expect(() => discoverSource(["source.png", "source.jpg"], "frame")).toThrow(
      "source.jpg, source.png",
    );
  });

  it("refuses unsupported source formats", () => {
    expect(() => discoverSource(["source.gif"], "frame")).toThrow(
      "Unsupported source format",
    );
  });
});

describe("safe EXIF metadata", () => {
  it("extracts and normalizes DateTimeOriginal without exposing other EXIF", () => {
    expect(extractCaptureDate(exifFixture("2026:06:21 19:57:46"))).toBe(
      "2026-06-21T19:57:46",
    );
    expect(extractCaptureDate(Buffer.from("not exif"))).toBeUndefined();
  });
});

describe("responsive image generation", () => {
  it("writes the configured variants without upscaling and removes stale variants", async () => {
    const directory = await fixtureDirectory();
    await createImage(path.join(directory, "source.jpg"));
    await writeFile(path.join(directory, "image-999.webp"), "stale");

    const entry = await generatePhotoAssets({
      directory,
      slug: "frame",
      source: { fileName: "source.jpg", legacy: false },
    });
    const files = await readdir(directory);

    expect(entry.width).toBe(900);
    expect(entry.height).toBe(600);
    expect(entry.orientation).toBe("landscape");
    expect(entry.variants.map((variant) => variant.width)).toEqual(
      imagePipelineConfig.widths,
    );
    expect(entry.variants.every((variant) => variant.outputWidth <= 900)).toBe(
      true,
    );
    expect(
      getExpectedGeneratedFiles().every((file) => files.includes(file)),
    ).toBe(true);
    expect(files).not.toContain("image-999.webp");
    expect(entry.blurDataURL).toMatch(/^data:image\/webp;base64,/);
    expect(entry.dominantColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("uses source and pipeline hashes for incremental invalidation", async () => {
    const directory = await fixtureDirectory();
    await createImage(path.join(directory, "source.jpg"));
    const source = { fileName: "source.jpg", legacy: false };
    const entry = await generatePhotoAssets({
      directory,
      slug: "frame",
      source,
    });

    await expect(isSourceEntryCurrent(directory, entry, source)).resolves.toBe(
      true,
    );
    await expect(
      isSourceEntryCurrent(
        directory,
        { ...entry, pipelineSignature: "old-configuration" },
        source,
      ),
    ).resolves.toBe(false);

    await createImage(path.join(directory, "source.jpg"), { color: "#171717" });
    await expect(isSourceEntryCurrent(directory, entry, source)).resolves.toBe(
      false,
    );
  });

  it("writes and reads a stable generated manifest", async () => {
    const directory = await fixtureDirectory();
    await createImage(path.join(directory, "source.jpg"));
    const entry = await generatePhotoAssets({
      directory,
      slug: "frame",
      source: { fileName: "source.jpg", legacy: false },
    });
    const manifestPath = path.join(directory, "photos.json");
    await writeManifestAtomic(manifestPath, { frame: entry });

    const manifest = await readManifest(manifestPath);
    expect(manifest.frame.sourceHash).toBe(entry.sourceHash);
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toHaveProperty(
      "frame.variants",
    );
  });
});
