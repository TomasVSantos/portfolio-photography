import { photoCategories } from "@/config/photo-categories.mjs";

export type PhotoOrientation = "landscape" | "portrait" | "square";

export { photoCategories };
export type PhotoCategory = (typeof photoCategories)[number];

export interface PhotoFrontmatter {
  title?: string;
  location?: string;
  camera?: string;
  lens?: string;
  date?: string;
  series?: string;
  category?: PhotoCategory;
  venue?: string;
  featured?: boolean;
  tags?: string[];
  alt?: string;
  seriesOrder?: number;
  draft?: boolean;
}

export interface PhotoExifDefaults {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  captureDate?: string;
}

export interface PhotoImageVariant {
  width: number;
  outputWidth: number;
  height: number;
  src: string;
}

export interface PhotoImageManifestEntry {
  source: string | null;
  sourceHash: string | null;
  pipelineSignature: string | null;
  legacy: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: PhotoOrientation;
  dominantColor: string;
  blurDataURL: string;
  variants: PhotoImageVariant[];
  fallback: string;
  fallbackWidth: number;
  fallbackHeight: number;
  exif?: PhotoExifDefaults;
}

export interface Photo {
  slug: string;
  title: string;
  location: string;
  camera?: string;
  lens?: string;
  date: string;
  capturedAt?: string;
  series: string;
  category: PhotoCategory;
  venue?: string;
  featured: boolean;
  tags: string[];
  alt: string;
  seriesOrder?: number;
  story: string;
  orientation: PhotoOrientation;
  image: PhotoImageManifestEntry;
}

export interface PhotoImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL: string;
  variants: PhotoImageVariant[];
}

export interface Series {
  slug: string;
  name: string;
  description?: string;
  category?: PhotoCategory;
  photos: Photo[];
}

export interface SeriesFrontmatter {
  title?: string;
  slug?: string;
  description?: string;
  category?: PhotoCategory;
}
