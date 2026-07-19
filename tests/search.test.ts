import { describe, expect, it } from "vitest";

import { searchIndex } from "@/lib/search";
import type { SearchIndexItem } from "@/types/search";

const items: SearchIndexItem[] = [
  {
    id: "photo:lighthouse",
    kind: "photo",
    title: "Lighthouse",
    href: "/photos/lighthouse",
    subtitle: "Culatra · Portugal",
    year: "2026",
    searchText: "sea iPhone 17 Pro travel lighthouse dunes",
  },
  {
    id: "photo:stage",
    kind: "photo",
    title: "Under the Lights",
    href: "/photos/under-the-lights",
    subtitle: "Live Music · Lisbon",
    year: "2026",
    searchText: "concert performer stage Fujifilm venue music",
  },
  {
    id: "page:about",
    kind: "page",
    title: "About",
    href: "/about",
    subtitle: "About Tomás Santos",
    searchText: "software engineer hobby photographer live music",
  },
];

describe("searchIndex", () => {
  it("finds title and metadata matches", () => {
    expect(searchIndex(items, "lighthouse")[0]?.id).toBe("photo:lighthouse");
    expect(searchIndex(items, "iPhone")[0]?.id).toBe("photo:lighthouse");
    expect(searchIndex(items, "concert")[0]?.id).toBe("photo:stage");
  });

  it("requires every token in a multi-word query", () => {
    expect(searchIndex(items, "live Lisbon").map((item) => item.id)).toEqual([
      "photo:stage",
    ]);
    expect(searchIndex(items, "live Culatra")).toEqual([]);
  });

  it("matches years and ignores accents and case", () => {
    expect(searchIndex(items, "2026")).toHaveLength(2);
    expect(searchIndex(items, "TOMAS")[0]?.id).toBe("page:about");
  });

  it("returns no results for an empty or unmatched query", () => {
    expect(searchIndex(items, "")).toEqual([]);
    expect(searchIndex(items, "medium format")).toEqual([]);
  });
});
