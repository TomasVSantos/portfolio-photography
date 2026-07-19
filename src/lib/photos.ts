import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import type { Photo, PhotoFrontmatter, Series } from "@/types/photo";

const photosDirectory = path.join(process.cwd(), "src/content/photos");

function assertFrontmatter(value: unknown, slug: string): PhotoFrontmatter {
  const data = value as Partial<PhotoFrontmatter>;
  const required: (keyof PhotoFrontmatter)[] = [
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
  ];

  for (const key of required) {
    if (data[key] === undefined) {
      throw new Error(`Photo "${slug}" is missing frontmatter field "${key}".`);
    }
  }

  const rawDate = (data as unknown as Record<string, unknown>).date;

  return {
    ...(data as PhotoFrontmatter),
    date:
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : String(rawDate),
  };
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

  return Array.from(grouped, ([name, photos]) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    photos,
  }));
}

export function getSeries(slug: string) {
  return getAllSeries().find((series) => series.slug === slug);
}
