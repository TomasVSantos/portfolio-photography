import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { GalleryLightbox } from "@/components/photo/gallery-lightbox";
import { getPhotoImage } from "@/lib/images";
import { getAllSeries, getSeries } from "@/lib/photos";

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
  return {
    title: series.name,
    description: `${series.name}, a photography series by Tomás Santos.`,
  };
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
    ...getPhotoImage(photo),
  }));

  return (
    <PageShell>
      <main>
        <Container>
          <header className="max-w-4xl py-20 sm:py-28 lg:py-36">
            <p className="text-muted-foreground text-[0.68rem] tracking-[0.22em] uppercase">
              Series · {series.photos.length.toString().padStart(2, "0")}
            </p>
            <h1 className="mt-6 font-serif text-6xl tracking-[-0.055em] sm:text-8xl lg:text-9xl">
              {series.name}
            </h1>
            <p className="text-muted-foreground mt-8 max-w-lg text-base leading-7">
              Photographs gathered through walking and returning—an open-ended
              study of place, work, weather, and the moments between.
            </p>
          </header>
          <GalleryLightbox items={items} />
        </Container>
      </main>
    </PageShell>
  );
}
