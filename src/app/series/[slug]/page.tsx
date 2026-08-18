import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { GalleryLightbox } from "@/components/photo/gallery-lightbox";
import { formatFilterValue } from "@/lib/gallery-filter";
import { getPhotoImage } from "@/lib/images";
import { getAllSeries, getSeries } from "@/lib/photos";
import { getLocationSlug, slugify } from "@/lib/slugs";
import {
  createPageMetadata,
  getPhotoMetadataImage,
  getSeriesDescription,
  getSeriesSeoTitle,
} from "@/lib/seo";

type SeriesPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSeries().map((series) => ({ slug: series.slug }));
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeries(slug);
  if (!series) return {};
  const coverImage = getPhotoImage(series.photos[0]);
  return createPageMetadata({
    title: getSeriesSeoTitle(series),
    description: getSeriesDescription(series),
    pathname: `/series/${series.slug}`,
    image: getPhotoMetadataImage(coverImage),
  });
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params;
  const series = getSeries(slug);
  if (!series) notFound();

  const items = series.photos.map((photo) => ({
    slug: photo.slug,
    title: photo.title,
    location: photo.location,
    series: photo.series,
    date: photo.date,
    tags: photo.tags,
    category: photo.category,
    locationSlug: getLocationSlug(photo.location),
    seriesSlug: slugify(photo.series),
    ...getPhotoImage(photo),
  }));

  return (
    <PageShell>
      <main>
        <Container>
          <header className="max-w-4xl py-20 sm:py-28 lg:py-36">
            <p className="text-muted-foreground text-[0.68rem] tracking-[0.22em] uppercase">
              Series
              {series.category && (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={`/gallery?category=${series.category}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {formatFilterValue(series.category)}
                  </Link>
                </>
              )}{" "}
              · {series.photos.length.toString().padStart(2, "0")} photographs
            </p>
            <h1 className="mt-6 font-serif text-6xl tracking-[-0.055em] sm:text-8xl lg:text-9xl">
              {series.name}
            </h1>
            <p className="text-muted-foreground mt-8 max-w-lg text-base leading-7">
              {getSeriesDescription(series)}
            </p>
          </header>
          <GalleryLightbox items={items} />
        </Container>
      </main>
    </PageShell>
  );
}
