import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import imageManifestJson from "@/generated/photos.json";
import { validateEditorialData } from "@/lib/photo-editorial.mjs";
import { slugify } from "@/lib/slugs";
import {
  photoCategories,
  type Photo,
  type PhotoFrontmatter,
  type PhotoImageManifestEntry,
  type Series,
  type SeriesFrontmatter,
} from "@/types/photo";

const photosDirectory = path.join(process.cwd(), "src/content/photos");
const seriesDirectory = path.join(process.cwd(), "src/content/series");
const imageManifest = imageManifestJson as Record<
  string,
  PhotoImageManifestEntry
>;

function normalizeDate(value: unknown) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value);
}

export function mergeEditorialWithDerived(
  data: PhotoFrontmatter,
  image: PhotoImageManifestEntry,
) {
  return {
    camera: data.camera?.trim() || image.exif?.camera,
    lens: data.lens?.trim() || image.exif?.lens,
  };
}

function assertPublishedFrontmatter(
  value: unknown,
  slug: string,
  image: PhotoImageManifestEntry | undefined,
) {
  const data = value as PhotoFrontmatter;
  const normalized = {
    ...data,
    ...(data.date === undefined ? {} : { date: normalizeDate(data.date) }),
  };
  const validation = validateEditorialData(
    normalized as Record<string, unknown>,
    slug,
  );
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("\n"));
  }
  if (!image) {
    throw new Error(
      `[${slug}] Missing generated image data. Run pnpm images:build -- ${slug} and commit src/generated/photos.json.`,
    );
  }

  return {
    title: normalized.title as string,
    location: normalized.location as string,
    date: normalized.date as string,
    series: normalized.series as string,
    category: normalized.category as Photo["category"],
    venue: normalized.venue,
    featured: normalized.featured as boolean,
    tags: normalized.tags as string[],
    alt: normalized.alt as string,
    order: normalized.order,
    ...mergeEditorialWithDerived(normalized, image),
  };
}

export function comparePhotos(a: Photo, b: Photo) {
  const aOrdered = a.order !== undefined;
  const bOrdered = b.order !== undefined;
  if (aOrdered && bOrdered && a.order !== b.order) return a.order! - b.order!;
  if (aOrdered !== bOrdered) return aOrdered ? -1 : 1;
  const dateOrder = b.date.localeCompare(a.date);
  return dateOrder || a.slug.localeCompare(b.slug);
}

function getSeriesMetadata(slug: string): SeriesFrontmatter | undefined {
  const filePath = path.join(seriesDirectory, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return undefined;

  const { data } = matter(fs.readFileSync(filePath, "utf8"));
  const metadata = data as SeriesFrontmatter;
  if (
    metadata.category !== undefined &&
    !photoCategories.includes(metadata.category)
  ) {
    throw new Error(
      `Series "${slug}" has unsupported category "${String(metadata.category)}".`,
    );
  }
  return metadata;
}

export function getAllPhotos(): Photo[] {
  if (!fs.existsSync(photosDirectory)) return [];

  const photos: Photo[] = [];
  const entries = fs
    .readdirSync(photosDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const entry of entries) {
    const filePath = path.join(photosDirectory, entry.name, "page.mdx");
    const file = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(file);
    const draftValidation = validateEditorialData(data, entry.name);
    if (draftValidation.errors.length > 0) {
      throw new Error(draftValidation.errors.join("\n"));
    }
    if (draftValidation.draft) continue;

    const image = imageManifest[entry.name];
    const frontmatter = assertPublishedFrontmatter(data, entry.name, image);
    photos.push({
      ...frontmatter,
      slug: entry.name,
      story: content.trim(),
      orientation: image.orientation,
      image,
    });
  }

  return photos.sort(comparePhotos);
}

export function getPhoto(slug: string) {
  return getAllPhotos().find((photo) => photo.slug === slug);
}

export function getPhotoNeighbors(slug: string) {
  const photos = getAllPhotos();
  const index = photos.findIndex((photo) => photo.slug === slug);
  return {
    previous: index < photos.length - 1 ? photos[index + 1] : photos[0],
    next: index > 0 ? photos[index - 1] : photos[photos.length - 1],
  };
}

export function getAllSeries(): Series[] {
  const grouped = new Map<string, Photo[]>();
  for (const photo of getAllPhotos()) {
    const current = grouped.get(photo.series) ?? [];
    grouped.set(photo.series, [...current, photo]);
  }

  return Array.from(grouped, ([name, photos]) => {
    const fallbackSlug = slugify(name);
    const metadata = getSeriesMetadata(fallbackSlug);
    return {
      name: metadata?.title ?? name,
      slug: metadata?.slug ?? fallbackSlug,
      description: metadata?.description,
      category: metadata?.category,
      photos,
    } satisfies Series;
  });
}

export function getSeries(slug: string) {
  return getAllSeries().find((series) => series.slug === slug);
}
