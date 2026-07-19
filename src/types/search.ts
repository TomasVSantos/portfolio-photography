export type SearchResultKind = "photo" | "series" | "page";

export interface SearchThumbnail {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface SearchIndexItem {
  id: string;
  kind: SearchResultKind;
  title: string;
  href: string;
  subtitle: string;
  year?: string;
  searchText: string;
  thumbnail?: SearchThumbnail;
}

export interface RankedSearchResult extends SearchIndexItem {
  score: number;
}
