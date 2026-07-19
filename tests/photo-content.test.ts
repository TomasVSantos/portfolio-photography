import { describe, expect, it } from "vitest";

import {
  comparePhotos,
  compareSeriesPhotos,
  mergeEditorialWithDerived,
} from "@/lib/photos";
import { validateEditorialData } from "@/lib/photo-editorial.mjs";
import type { Photo, PhotoImageManifestEntry } from "@/types/photo";

const image = {
  exif: { camera: "Fujifilm X-T5", lens: "XF 35mm F1.4 R" },
} as PhotoImageManifestEntry;

function photo(
  slug: string,
  date: string,
  seriesOrder?: number,
  capturedAt?: string,
) {
  return { slug, date, seriesOrder, capturedAt } as Photo;
}

describe("photo editorial metadata", () => {
  it("lets explicit MDX camera and lens values override derived EXIF defaults", () => {
    expect(
      mergeEditorialWithDerived(
        { camera: "iPhone 17 Pro", lens: "26mm equivalent" },
        image,
      ),
    ).toEqual({ camera: "iPhone 17 Pro", lens: "26mm equivalent" });
    expect(mergeEditorialWithDerived({}, image)).toEqual(image.exif);
  });

  it("allows incomplete drafts but rejects incomplete published photographs", () => {
    expect(validateEditorialData({ draft: true }, "draft").errors).toEqual([]);
    expect(validateEditorialData({}, "published").errors).toContain(
      "[published] Missing required frontmatter field: alt",
    );
  });
});

describe("deterministic photo ordering", () => {
  it("uses descending EXIF capture time, then date and slug for global lists", () => {
    const photos = [
      photo("morning", "2026-01-01", undefined, "2026-01-01T08:00:00"),
      photo("evening", "2026-01-01", undefined, "2026-01-01T20:00:00"),
      photo("newest", "2026-03-01"),
      photo("ordered-last", "2020-01-01", 20),
      photo("ordered-first", "2020-01-01", 10),
    ].sort(comparePhotos);

    expect(photos.map(({ slug }) => slug)).toEqual([
      "newest",
      "evening",
      "morning",
      "ordered-first",
      "ordered-last",
    ]);
  });

  it("uses explicit series order only within a series", () => {
    const photos = [
      photo("newest", "2026-03-01"),
      photo("ordered-last", "2020-01-01", 20),
      photo("ordered-first", "2020-01-01", 10),
    ].sort(compareSeriesPhotos);

    expect(photos.map(({ slug }) => slug)).toEqual([
      "ordered-first",
      "ordered-last",
      "newest",
    ]);
  });
});
