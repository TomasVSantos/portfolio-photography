import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { slugify } from "@/lib/slugs";
import {
  photoCategories,
  type Photo,
  type PhotoFrontmatter,
  type Series,
  type SeriesFrontmatter,
} from "@/types/photo";

const photosDirectory = path.join(process.cwd(), "src/content/photos");
const seriesDirectory = path.join(process.cwd(), "src/content/series");

function assertFrontmatter(value: unknown, slug: string): PhotoFrontmatter {
  const data = value as Partial<PhotoFrontmatter>;
  const required = [
    "title",
    "location",
    "camera",
    "lens",
    "date",
    "series",
    "featured",
    "tags",
    "image",
    "width",
    "height",
    "color",
    "alt",
  ] as const;

  for (const key of required) {
    if (data[key] === undefined) {
      throw new Error(`Photo "${slug}" is missing frontmatter field "${key}".`);
    }
  }

  const rawDate = (data as unknown as Record<string, unknown>).date;
  if (data.category !== undefined && !photoCategories.includes(data.category)) {
    throw new Error(
      `Photo "${slug}" has unsupported category "${String(data.category)}".`,
    );
  }

  return {
    ...(data as PhotoFrontmatter),
    date:
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : String(rawDate),
  };
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

  return fs
    .readdirSync(photosDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const filePath = path.join(photosDirectory, entry.name, "page.mdx");
      const file = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(file);
      const frontmatter = assertFrontmatter(data, entry.name);

      return {
        ...frontmatter,
        slug: entry.name,
        story: content.trim(),
        orientation:
          frontmatter.height > frontmatter.width ? "portrait" : "landscape",
      } satisfies Photo;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
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
