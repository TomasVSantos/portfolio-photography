import type { Photo, PhotoImage } from "@/types/photo";

interface ImageProvider {
  resolve(photo: Photo): PhotoImage;
}

function makeBlurDataURL(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><filter id="b"><feGaussianBlur stdDeviation="12"/></filter><rect width="100%" height="100%" fill="${color}" filter="url(#b)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const localImageProvider: ImageProvider = {
  resolve(photo) {
    return {
      src: `/photos/${photo.slug}/${photo.image}`,
      width: photo.width,
      height: photo.height,
      alt: photo.alt,
      blurDataURL: makeBlurDataURL(photo.color),
    };
  },
};

// The UI only consumes this adapter. A future R2 provider can replace the
// implementation without changing cards, galleries, or photo pages.
export function getPhotoImage(photo: Photo) {
  return localImageProvider.resolve(photo);
}
