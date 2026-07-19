import { navigation, siteConfig } from "@/config/site";
import { getPhotoImage } from "@/lib/images";
import { getAllPhotos, getAllSeries } from "@/lib/photos";
import type { SearchIndexItem } from "@/types/search";

const pageDetails: Record<
  (typeof navigation)[number]["label"],
  { subtitle: string; keywords: string }
> = {
  Gallery: {
    subtitle: "All photographs",
    keywords:
      "photographs places people travel street documentary concert live music performers venues atmosphere",
  },
  About: {
    subtitle: `About ${siteConfig.name}`,
    keywords:
      "software engineer portugal hobby photographer travel everyday life music concert live performance",
  },
  Gear: {
    subtitle: "Cameras and lenses",
    keywords: "Fujifilm iPhone cameras lenses photography equipment",
  },
  Contact: {
    subtitle: "Email and social links",
    keywords: "email instagram github contact collaboration",
  },
};

export function getSearchIndex(): SearchIndexItem[] {
  const photos = getAllPhotos();
  const photoItems: SearchIndexItem[] = photos.map((photo) => {
    const image = getPhotoImage(photo);
    return {
      id: `photo:${photo.slug}`,
      kind: "photo",
      title: photo.title,
      href: `/photos/${photo.slug}`,
      subtitle: `${photo.series} · ${photo.location}`,
      year: photo.date.slice(0, 4),
      searchText: [
        photo.story,
        photo.location,
        photo.date,
        photo.tags.join(" "),
        photo.camera,
        photo.lens,
        photo.series,
        photo.category,
        photo.venue,
      ]
        .filter(Boolean)
        .join(" "),
      thumbnail: {
        src: image.src,
        alt: image.alt,
        width: image.width,
        height: image.height,
      },
    };
  });

  const seriesItems: SearchIndexItem[] = getAllSeries().map((series) => ({
    id: `series:${series.slug}`,
    kind: "series",
    title: series.name,
    href: `/series/${series.slug}`,
    subtitle: `${series.photos.length} photograph${series.photos.length === 1 ? "" : "s"}`,
    searchText: [
      series.description,
      series.category,
      ...series.photos.flatMap((photo) => [
        photo.location,
        photo.tags.join(" "),
        photo.category,
      ]),
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const pageItems: SearchIndexItem[] = navigation.map((page) => ({
    id: `page:${page.label.toLowerCase()}`,
    kind: "page",
    title: page.label,
    href: page.href,
    subtitle: pageDetails[page.label].subtitle,
    searchText: pageDetails[page.label].keywords,
  }));

  return [...photoItems, ...seriesItems, ...pageItems];
}
