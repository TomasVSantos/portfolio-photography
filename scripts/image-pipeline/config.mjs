import { createHash } from "node:crypto";

/**
 * Shared image-pipeline configuration. Legacy widths remain in the set so
 * existing public URLs continue to resolve while newer, larger sources gain
 * the 1200, 1600, and 2400 pixel portfolio sizes.
 */
export const imagePipelineConfig = Object.freeze({
  version: "2",
  widths: Object.freeze([256, 384, 480, 768, 1024, 1200, 1536, 1600, 2400]),
  canonicalMaxWidth: 2400,
  quality: Object.freeze({
    canonical: 86,
    variant: 82,
    blur: 36,
  }),
  blurWidth: 24,
  supportedSourceExtensions: Object.freeze([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".tif",
    ".tiff",
    ".avif",
  ]),
});

export const pipelineSignature = createHash("sha256")
  .update(JSON.stringify(imagePipelineConfig))
  .digest("hex")
  .slice(0, 16);
