import { describe, expect, it } from "vitest";

import { comparePhotos, mergeEditorialWithDerived } from "@/lib/photos";
import { validateEditorialData } from "@/lib/photo-editorial.mjs";
import type { Photo, PhotoImageManifestEntry } from "@/types/photo";

const image = {
  exif: { camera: "Fujifilm X-T5", lens: "XF 35mm F1.4 R" },
} as PhotoImageManifestEntry;

function photo(slug: string, date: string, order?: number) {
  return { slug, date, order } as Photo;
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
  it("uses explicit order, then descending date, then ascending slug", () => {
    const photos = [
      photo("zulu", "2026-01-01"),
      photo("alpha", "2026-01-01"),
      photo("newest", "2026-03-01"),
      photo("ordered-last", "2020-01-01", 20),
      photo("ordered-first", "2020-01-01", 10),
    ].sort(comparePhotos);

    expect(photos.map(({ slug }) => slug)).toEqual([
      "ordered-first",
      "ordered-last",
      "newest",
      "alpha",
      "zulu",
    ]);
  });
});
