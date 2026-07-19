import { getLocationSlug, slugify } from "./slugs";

export const galleryFilterKeys = [
  "series",
  "category",
  "year",
  "location",
  "tag",
] as const;

export type GalleryFilterKey = (typeof galleryFilterKeys)[number];
export type GalleryFilters = Partial<Record<GalleryFilterKey, string>>;

export interface FilterablePhoto {
  series: string;
  category?: string;
  date: string;
  location: string;
  tags: string[];
}

export function getGalleryFilters(params: URLSearchParams): GalleryFilters {
  return Object.fromEntries(
    galleryFilterKeys.flatMap((key) => {
      const value = params.get(key);
      return value ? [[key, slugify(value)] as const] : [];
    }),
  );
}

export function filterGalleryItems<T extends FilterablePhoto>(
  items: T[],
  filters: GalleryFilters,
) {
  const entries = Object.entries(filters) as [GalleryFilterKey, string][];
  if (!entries.length) return items;

  return items.filter((item) =>
    entries.every(([key, value]) => {
      if (key === "series") return slugify(item.series) === value;
      if (key === "category") return slugify(item.category ?? "") === value;
      if (key === "year") return item.date.slice(0, 4) === value;
      if (key === "location") return getLocationSlug(item.location) === value;
      return item.tags.some((tag) => slugify(tag) === value);
    }),
  );
}

export function formatFilterValue(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
