export type PhotoOrientation = "landscape" | "portrait";

export const photoCategories = [
  "documentary",
  "street",
  "travel",
  "concert",
  "music",
  "portrait",
  "other",
] as const;

export type PhotoCategory = (typeof photoCategories)[number];

export interface PhotoFrontmatter {
  title: string;
  location: string;
  camera: string;
  lens: string;
  date: string;
  series: string;
  category?: PhotoCategory;
  venue?: string;
  featured: boolean;
  tags: string[];
  image: string;
  width: number;
  height: number;
  color: string;
  alt: string;
}

export interface Photo extends PhotoFrontmatter {
  slug: string;
  story: string;
  orientation: PhotoOrientation;
}

export interface PhotoImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL: string;
}

export interface Series {
  slug: string;
  name: string;
  description?: string;
  category?: PhotoCategory;
  photos: Photo[];
}

export interface SeriesFrontmatter {
  title?: string;
  slug?: string;
  description?: string;
  category?: PhotoCategory;
}
