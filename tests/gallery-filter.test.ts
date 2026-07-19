import { describe, expect, it } from "vitest";

import {
  filterGalleryItems,
  getGalleryFilters,
  type FilterablePhoto,
} from "@/lib/gallery-filter";

const photos: (FilterablePhoto & { id: string })[] = [
  {
    id: "lighthouse",
    series: "Culatra",
    category: "travel",
    date: "2026-07-18",
    location: "Culatra, Portugal",
    tags: ["lighthouse", "sea"],
  },
  {
    id: "stage",
    series: "Live Music",
    category: "concert",
    date: "2025-06-20",
    location: "Lisbon, Portugal",
    tags: ["live music", "stage"],
  },
  {
    id: "legacy",
    series: "London",
    date: "2024-04-02",
    location: "London, United Kingdom",
    tags: ["street"],
  },
];

describe("gallery filtering", () => {
  it("parses supported URL filters", () => {
    const params = new URLSearchParams(
      "series=Live%20Music&category=concert&year=2025&location=Lisbon&tag=live-music",
    );

    expect(getGalleryFilters(params)).toEqual({
      series: "live-music",
      category: "concert",
      year: "2025",
      location: "lisbon",
      tag: "live-music",
    });
  });

  it.each([
    ["series=culatra", "lighthouse"],
    ["category=concert", "stage"],
    ["year=2024", "legacy"],
    ["location=lisbon", "stage"],
    ["tag=live-music", "stage"],
  ])("filters %s", (query, expectedId) => {
    const filtered = filterGalleryItems(
      photos,
      getGalleryFilters(new URLSearchParams(query)),
    );
    expect(filtered.map((photo) => photo.id)).toEqual([expectedId]);
  });

  it("keeps legacy photographs without optional categories valid", () => {
    expect(filterGalleryItems(photos, {})).toHaveLength(3);
    expect(
      filterGalleryItems(photos, { category: "concert" }).map(
        (photo) => photo.id,
      ),
    ).not.toContain("legacy");
  });
});
