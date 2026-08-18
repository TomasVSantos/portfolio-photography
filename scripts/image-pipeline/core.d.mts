export interface DiscoveredSource {
  fileName: string;
  legacy: boolean;
}

export interface ImageManifestVariant {
  width: number;
  outputWidth: number;
  height: number;
  src: string;
}

export interface ImageManifestEntry {
  source: string | null;
  sourceHash: string | null;
  pipelineSignature: string | null;
  legacy: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: "landscape" | "portrait" | "square";
  dominantColor: string;
  blurDataURL: string;
  variants: ImageManifestVariant[];
  fallback: string;
  fallbackWidth: number;
  fallbackHeight: number;
  exif?: {
    camera?: string;
    lens?: string;
    focalLength?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    captureDate?: string;
  };
}

export class ImagePipelineError extends Error {}
export function isGeneratedImage(fileName: string): boolean;
export function discoverSource(
  files: string[],
  slug: string,
): DiscoveredSource | null;
export function getExpectedGeneratedFiles(): string[];
export function hashFile(filePath: string): Promise<string>;
export function extractCaptureDate(
  exif: Buffer | undefined,
): string | undefined;
export function extractExifDefaults(
  exif: Buffer | undefined,
): ImageManifestEntry["exif"] | undefined;
export function readSafeExifDefaults(
  input: string,
): Promise<ImageManifestEntry["exif"] | undefined>;
export function outputsAreCurrent(
  directory: string,
  entry: ImageManifestEntry,
): Promise<boolean>;
export function isSourceEntryCurrent(
  directory: string,
  entry: ImageManifestEntry | undefined,
  source: DiscoveredSource,
): Promise<boolean>;
export function generatePhotoAssets(input: {
  directory: string;
  slug: string;
  source: DiscoveredSource;
}): Promise<ImageManifestEntry>;
export function createLegacyManifestEntry(
  directory: string,
  slug: string,
): Promise<ImageManifestEntry | null>;
export function readManifest(
  manifestPath: string,
): Promise<Record<string, ImageManifestEntry>>;
export function writeManifestAtomic(
  manifestPath: string,
  manifest: Record<string, ImageManifestEntry>,
): Promise<void>;
