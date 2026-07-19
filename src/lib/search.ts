import type { RankedSearchResult, SearchIndexItem } from "../types/search";

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchIndex(
  items: SearchIndexItem[],
  query: string,
): RankedSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return items
    .map((item) => {
      const title = normalizeSearchText(item.title);
      const subtitle = normalizeSearchText(item.subtitle);
      const haystack = normalizeSearchText(
        `${item.title} ${item.subtitle} ${item.year ?? ""} ${item.searchText}`,
      );

      if (!tokens.every((token) => haystack.includes(token))) return null;

      let score = item.kind === "photo" ? 6 : item.kind === "series" ? 4 : 2;
      if (title === normalizedQuery) score += 100;
      else if (title.startsWith(normalizedQuery)) score += 70;
      else if (title.includes(normalizedQuery)) score += 45;

      for (const token of tokens) {
        if (title.startsWith(token)) score += 18;
        else if (title.includes(token)) score += 12;
        if (subtitle.includes(token)) score += 7;
        if (item.year === token) score += 10;
      }

      return { ...item, score };
    })
    .filter((item): item is RankedSearchResult => item !== null)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
