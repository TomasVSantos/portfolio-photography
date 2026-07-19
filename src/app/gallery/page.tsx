import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { GalleryView } from "@/components/photo/gallery-view";
import { GalleryLightbox } from "@/components/photo/gallery-lightbox";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPhotoImage } from "@/lib/images";
import { getAllPhotos } from "@/lib/photos";
import { getLocationSlug, slugify } from "@/lib/slugs";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Places, people, live music, and everyday moments photographed by Tomás Santos.",
};

export default function GalleryPage() {
  const photos = getAllPhotos();
  const items = photos.map((photo) => ({
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
          <header className="py-20 sm:py-28 lg:py-36">
            <SectionHeading
              eyebrow={`${photos.length.toString().padStart(2, "0")} photographs`}
            >
              Gallery
            </SectionHeading>
            <p className="text-muted-foreground mt-7 max-w-lg text-base leading-7">
              Places, people, and atmosphere—from quiet streets to live stages.
              Select an image to enter the full-screen view, or open its story
              below.
            </p>
          </header>
          <Suspense fallback={<GalleryLightbox items={items} />}>
            <GalleryView items={items} />
          </Suspense>
        </Container>
      </main>
    </PageShell>
  );
}
