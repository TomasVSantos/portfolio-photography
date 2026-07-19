import type { ImageLoaderProps } from "next/image";

export default function imageLoader({ src, width }: ImageLoaderProps) {
  if (!src.startsWith("/photos/") || !src.endsWith(".webp")) return src;
  return src.replace(/\.webp$/, `-${width}.webp`);
}
