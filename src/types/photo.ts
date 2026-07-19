export type PhotoOrientation = "landscape" | "portrait";

export interface PhotoFrontmatter {
  title: string;
  location: string;
  camera: string;
  lens: string;
  date: string;
  series: string;
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
  photos: Photo[];
}
