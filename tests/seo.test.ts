import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import {
  createPageMetadata,
  getCanonicalUrl,
  getPhotoDescription,
  getPhotoLastModified,
  getPhotoJsonLd,
  getPhotoSeoTitle,
  getSeriesDescription,
} from "@/lib/seo";
import type { Photo, Series } from "@/types/photo";

const photo = {
  slug: "still-playing",
  title: "Still Playing",
  subject: "Masayoshi Takanaka",
  venue: "Crystal Palace Bowl",
  location: "London, England",
  date: "2026-08-07",
  series: "London",
  alt: "Masayoshi Takanaka seated in a red suit, playing a black guitar beneath a warm stage light.",
  story:
    "Some of the quietest moments of the show ended up being my favourites to photograph.",
} as Photo;

describe("SEO metadata helpers", () => {
  it("builds a semantic photo title without changing the artistic title", () => {
    expect(getPhotoSeoTitle(photo)).toBe(
      "Still Playing — Masayoshi Takanaka at Crystal Palace Bowl",
    );
  });

  it("builds a concise description from structured and editorial metadata", () => {
    const description = getPhotoDescription(photo);

    expect(description).toContain("Masayoshi Takanaka");
    expect(description).toContain("Crystal Palace Bowl");
    expect(description).toContain("London, England");
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("falls back to alt text when a photograph has no named subject", () => {
    const description = getPhotoDescription({
      ...photo,
      subject: undefined,
      venue: undefined,
      alt: "A quiet street framed by white buildings and late afternoon light.",
    });

    expect(description).toContain("A quiet street framed by white buildings");
    expect(description).not.toContain("undefined");
  });

  it("does not repeat a place already named in the alt text", () => {
    const description = getPhotoDescription({
      ...photo,
      subject: undefined,
      venue: undefined,
      title: "Berwick Street",
      location: "Berwick Street, Soho, London, England",
      alt: "A view along Berwick Street with pedestrians and shopfronts.",
    });

    expect(description).not.toContain("in Berwick Street, Soho");
  });

  it("keeps route canonicals absolute and consistently trailing-slash", () => {
    expect(getCanonicalUrl("/photos/still-playing")).toBe(
      "https://tomasvsantos.pt/photos/still-playing/",
    );
    expect(getCanonicalUrl("/")).toBe("https://tomasvsantos.pt/");
  });

  it("provides complete social metadata when an image is available", () => {
    const metadata = createPageMetadata({
      title: "Still Playing — Masayoshi Takanaka",
      description: "A photograph of Masayoshi Takanaka.",
      pathname: "/photos/still-playing",
      image: {
        url: "https://tomasvsantos.pt/photos/still-playing/image.webp",
        width: 2400,
        height: 3200,
        alt: photo.alt,
      },
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://tomasvsantos.pt/photos/still-playing/",
    );
    expect(metadata.openGraph?.url).toBe(
      "https://tomasvsantos.pt/photos/still-playing/",
    );
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: "https://tomasvsantos.pt/photos/still-playing/image.webp",
        width: 2400,
        height: 3200,
        alt: photo.alt,
      }),
    ]);
    expect(metadata.twitter?.images).toEqual([
      expect.objectContaining({
        url: "https://tomasvsantos.pt/photos/still-playing/image.webp",
      }),
    ]);
  });

  it("uses explicit update dates when available", () => {
    expect(getPhotoLastModified({ ...photo, updatedAt: "2026-08-10" })).toBe(
      "2026-08-10",
    );
    expect(getPhotoLastModified(photo)).toBe("2026-08-07");
  });

  it("keeps image-only Schema.org properties on an ImageObject", () => {
    const photoForJsonLd = {
      ...photo,
      image: {
        source: "source.avif",
        width: 3024,
        height: 4032,
      } as Photo["image"],
      tags: [],
      category: "concert",
    } as Photo;
    const jsonLd = getPhotoJsonLd(photoForJsonLd);

    expect(jsonLd).not.toHaveProperty("contentUrl");
    expect(jsonLd).not.toHaveProperty("width");
    expect(jsonLd).not.toHaveProperty("height");
    expect(jsonLd.image).toEqual({
      "@type": "ImageObject",
      url: "https://tomasvsantos.pt/photos/still-playing/source.avif",
      contentUrl: "https://tomasvsantos.pt/photos/still-playing/source.avif",
      width: 3024,
      height: 4032,
      caption: photo.alt,
    });
    expect(jsonLd.contentLocation).toEqual({
      "@type": "Place",
      name: "London, England",
    });
    expect(jsonLd.locationCreated).toEqual({
      "@type": "Place",
      name: "Crystal Palace Bowl",
    });
  });

  it("derives useful series context when no description was authored", () => {
    const series = {
      name: "Culatra",
      photos: [
        { location: "Culatra, Portugal" },
        { location: "Culatra, Portugal" },
      ],
    } as Series;

    expect(getSeriesDescription(series)).toContain("Culatra, Portugal");
    expect(getSeriesDescription(series)).toContain("2 photographs");
  });
});

describe("image sitemap", () => {
  it("adds crawlable source images to photo URLs without deployment timestamps", () => {
    const entries = sitemap();
    const photoEntry = entries.find((entry) =>
      entry.url.includes("/photos/still-playing/"),
    );
    const homeEntry = entries.find(
      (entry) => entry.url === "https://tomasvsantos.pt/",
    );

    expect(photoEntry?.images).toEqual([
      "https://tomasvsantos.pt/photos/still-playing/source.avif",
    ]);
    expect(photoEntry?.lastModified).toBe("2026-08-07");
    expect(homeEntry?.lastModified).toBeUndefined();
  });
});
