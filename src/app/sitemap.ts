import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getAllPhotos, getAllSeries } from "@/lib/photos";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/gallery", "/about", "/gear", "/contact"].map(
    (route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.7,
    }),
  );
  const photoRoutes = getAllPhotos().map((photo) => ({
    url: `${siteConfig.url}/photos/${photo.slug}`,
    lastModified: new Date(photo.date),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));
  const seriesRoutes = getAllSeries().map((series) => ({
    url: `${siteConfig.url}/series/${series.slug}`,
    lastModified: new Date(series.photos[0].date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...photoRoutes, ...seriesRoutes];
}
