import type { MetadataRoute } from "next";

import { getPhotoSourcePath } from "@/lib/images";
import { getAllPhotos, getAllSeries } from "@/lib/photos";
import {
  getAbsoluteUrl,
  getCanonicalUrl,
  getPhotoLastModified,
} from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/gallery",
    "/series",
    "/about",
    "/gear",
    "/contact",
  ].map((route) => ({ url: getCanonicalUrl(route) }));
  const photoRoutes = getAllPhotos().map((photo) => ({
    url: getCanonicalUrl(`/photos/${photo.slug}`),
    lastModified: getPhotoLastModified(photo),
    images: [getAbsoluteUrl(getPhotoSourcePath(photo))],
  }));
  const seriesRoutes = getAllSeries().map((series) => ({
    url: getCanonicalUrl(`/series/${series.slug}`),
    lastModified: getPhotoLastModified(
      series.photos.reduce(
        (latest, photo) =>
          getPhotoLastModified(photo) > getPhotoLastModified(latest)
            ? photo
            : latest,
        series.photos[0],
      ),
    ),
  }));

  return [...staticRoutes, ...photoRoutes, ...seriesRoutes];
}
