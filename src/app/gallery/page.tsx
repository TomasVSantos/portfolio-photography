import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { GalleryLightbox } from "@/components/photo/gallery-lightbox";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPhotoImage } from "@/lib/images";
import { getAllPhotos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A curated gallery of documentary, travel, and street photography by Tomás Santos.",
};

export default function GalleryPage() {
  const photos = getAllPhotos();
  const items = photos.map((photo) => ({
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
          <header className="py-20 sm:py-28 lg:py-36">
            <SectionHeading
              eyebrow={`${photos.length.toString().padStart(2, "0")} photographs`}
            >
              Gallery
            </SectionHeading>
            <p className="text-muted-foreground mt-7 max-w-lg text-base leading-7">
              Photographs from Portugal and elsewhere. Select an image to enter
              the full-screen view, or open its story below.
            </p>
          </header>
          <GalleryLightbox items={items} />
        </Container>
      </main>
    </PageShell>
  );
}
