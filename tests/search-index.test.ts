import { describe, expect, it } from "vitest";

import { getSearchIndex } from "@/lib/search-index";

describe("getSearchIndex", () => {
  it("builds static records for photos, series, and pages", () => {
    const index = getSearchIndex();

    expect(index.some((item) => item.kind === "photo")).toBe(true);
    expect(index.some((item) => item.kind === "series")).toBe(true);
    expect(index.some((item) => item.kind === "page")).toBe(true);
  });

  it("includes searchable MDX metadata and thumbnails", () => {
    const farol = getSearchIndex().find(
      (item) => item.id === "photo:culatra-farol",
    );

    expect(farol?.searchText).toContain("iPhone 17 Pro");
    expect(farol?.searchText).toContain("travel");
    expect(farol?.thumbnail?.src).toContain("culatra-farol");
  });
});
