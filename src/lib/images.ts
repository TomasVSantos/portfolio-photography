import type { Photo, PhotoImage } from "@/types/photo";

interface ImageProvider {
  resolve(photo: Photo): PhotoImage;
}

const localImageProvider: ImageProvider = {
  resolve(photo) {
    return {
      src: photo.image.fallback,
      width: photo.image.fallbackWidth,
      height: photo.image.fallbackHeight,
      alt: photo.alt,
      blurDataURL: photo.image.blurDataURL,
      variants: photo.image.variants,
    };
  },
};

// The UI only consumes this adapter. A future R2 provider can replace the
// implementation without changing cards, galleries, or photo pages.
export function getPhotoImage(photo: Photo) {
  return localImageProvider.resolve(photo);
}
