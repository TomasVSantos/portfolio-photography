import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { getPhotoSourcePath } from "@/lib/images";
import type { Photo, PhotoImage, Series } from "@/types/photo";

const MAX_DESCRIPTION_LENGTH = 160;

type PhotoSeoInput = Pick<
  Photo,
  "title" | "location" | "date" | "series" | "alt" | "story"
> &
  Partial<Pick<Photo, "subject" | "venue">>;

export interface MetadataImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/, "");
}

function formatPhotoDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function truncateDescription(value: string) {
  const text = cleanText(value);
  if (text.length <= MAX_DESCRIPTION_LENGTH) return text;

  const shortened = text
    .slice(0, MAX_DESCRIPTION_LENGTH - 1)
    .replace(/\s+\S*$/, "")
    .replace(/[,:;—-]+$/, "")
    .trim();
  return `${shortened}…`;
}

function getStoryExcerpt(story: string) {
  const paragraph = cleanText(story.split(/\n\s*\n/)[0]);
  const withoutMarkdown = paragraph.replace(/[*_`]/g, "");
  const sentence = withoutMarkdown.match(/^.+?[.!?](?:\s|$)/)?.[0];
  return stripTrailingPunctuation(sentence ?? withoutMarkdown);
}

function altMentionsLocation(alt: string, location: string) {
  const placeName = location.split(",")[0]?.trim().toLocaleLowerCase();
  return Boolean(
    placeName &&
    placeName.length > 2 &&
    alt.toLocaleLowerCase().includes(placeName),
  );
}

function appendDescriptionPart(description: string, part: string) {
  const candidate = `${description}${part}`;
  return candidate.length + 1 <= MAX_DESCRIPTION_LENGTH
    ? candidate
    : description;
}

export function getPhotoSeoTitle(
  photo: Pick<Photo, "title" | "subject" | "venue">,
) {
  const subject = cleanText(photo.subject);
  const venue = cleanText(photo.venue);

  if (subject && venue) return `${photo.title} — ${subject} at ${venue}`;
  if (subject) return `${photo.title} — ${subject}`;
  if (venue) return `${photo.title} at ${venue}`;
  return photo.title;
}

export function getPhotoDescription(photo: PhotoSeoInput) {
  const title = cleanText(photo.title);
  const subject = cleanText(photo.subject);
  const venue = cleanText(photo.venue);
  const location = cleanText(photo.location);
  const series = cleanText(photo.series);
  const alt = stripTrailingPunctuation(cleanText(photo.alt));

  let description = subject
    ? `${title} — a photograph of ${subject}`
    : `${title} — ${alt}`;

  if (venue)
    description = appendDescriptionPart(
      description,
      subject ? ` at ${venue}` : `. Photographed at ${venue}`,
    );
  if (location && (subject || !altMentionsLocation(alt, location)))
    description = appendDescriptionPart(
      description,
      subject ? ` in ${location}` : `, in ${location}`,
    );
  if (photo.date)
    description = appendDescriptionPart(
      description,
      ` on ${formatPhotoDate(photo.date)}`,
    );
  if (series)
    description = appendDescriptionPart(
      description,
      `, from the ${series} series`,
    );

  const storyExcerpt = getStoryExcerpt(photo.story);
  if (storyExcerpt)
    description = appendDescriptionPart(description, ` ${storyExcerpt}`);

  return truncateDescription(`${description}.`);
}

export function getCanonicalUrl(pathname = "/") {
  const normalizedPath =
    pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}/`;
  return new URL(normalizedPath, `${siteConfig.url}/`).toString();
}

export function getAbsoluteUrl(pathname: string) {
  return new URL(pathname, `${siteConfig.url}/`).toString();
}

export function getPhotoLastModified(photo: Pick<Photo, "date" | "updatedAt">) {
  return photo.updatedAt ?? photo.date;
}

export function getSeriesSeoTitle(series: Pick<Series, "name">) {
  return `${series.name} photography series`;
}

export function getSeriesDescription(series: Series) {
  const description = cleanText(series.description);
  if (description) return description;

  const locations = Array.from(
    new Set(
      series.photos.map((photo) => cleanText(photo.location)).filter(Boolean),
    ),
  );
  const locationText =
    locations.length === 1
      ? ` from ${locations[0]}`
      : locations.length > 1
        ? ` across ${locations.slice(0, 3).join(", ")}`
        : "";
  const count = series.photos.length;
  const noun = count === 1 ? "photograph" : "photographs";

  return `${series.name} is a collection of ${count} ${noun} by ${siteConfig.name}${locationText}.`;
}

export function getPhotoMetadataImage(image: PhotoImage): MetadataImage {
  return {
    url: getAbsoluteUrl(image.src),
    width: image.width,
    height: image.height,
    alt: image.alt,
  };
}

export function createPageMetadata({
  title,
  description,
  pathname,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  pathname: string;
  image?: MetadataImage;
  type?: "website" | "article";
}): Metadata {
  const canonical = getCanonicalUrl(pathname);
  const socialTitle = `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      locale: "en_GB",
      siteName: siteConfig.name,
      title: socialTitle,
      description,
      url: canonical,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function getPhotoJsonLd(photo: Photo) {
  const sourceUrl = getAbsoluteUrl(getPhotoSourcePath(photo));
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Photograph",
    name: photo.title,
    description: getPhotoDescription(photo),
    url: getCanonicalUrl(`/photos/${photo.slug}`),
    image: {
      "@type": "ImageObject",
      url: sourceUrl,
      contentUrl: sourceUrl,
      width: photo.image.width,
      height: photo.image.height,
      caption: photo.alt,
    },
    dateCreated: photo.date,
    creator: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    creditText: siteConfig.name,
    copyrightHolder: {
      "@type": "Person",
      name: siteConfig.name,
    },
    keywords: Array.from(
      new Set([photo.subject, photo.venue, ...photo.tags, photo.category]),
    )
      .filter(Boolean)
      .join(", "),
    contentLocation: { "@type": "Place", name: photo.location },
  };

  if (photo.updatedAt) data.dateModified = photo.updatedAt;
  if (photo.venue) {
    data.locationCreated = { "@type": "Place", name: photo.venue };
  }

  return data;
}
