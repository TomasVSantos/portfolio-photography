import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { ShareButton } from "@/components/photo/share-button";
import { siteConfig } from "@/config/site";
import { getPhotoImage } from "@/lib/images";
import { getAllPhotos, getPhoto, getPhotoNeighbors } from "@/lib/photos";

type PhotoPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPhotos().map((photo) => ({ slug: photo.slug }));
}

export async function generateMetadata({
  params,
}: PhotoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const photo = getPhoto(slug);
  if (!photo) return {};
  const image = getPhotoImage(photo);
  const description = `${photo.title}, photographed in ${photo.location}. Part of the ${photo.series} series.`;

  return {
    title: photo.title,
    description,
    alternates: { canonical: `/photos/${photo.slug}` },
    openGraph: {
      type: "article",
      title: photo.title,
      description,
      url: `/photos/${photo.slug}`,
      images: [
        {
          url: image.src,
          width: image.width,
          height: image.height,
          alt: image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: photo.title,
      description,
      images: [image.src],
    },
  };
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { slug } = await params;
  const photo = getPhoto(slug);
  if (!photo) notFound();

  const image = getPhotoImage(photo);
  const { previous, next } = getPhotoNeighbors(photo.slug);
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${photo.date}T12:00:00`));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Photograph",
    name: photo.title,
    description: photo.story.split("\n")[0],
    contentUrl: `${siteConfig.url}${image.src}`,
    dateCreated: photo.date,
    keywords: photo.tags.join(", "),
    creator: { "@type": "Person", name: siteConfig.name },
    contentLocation: { "@type": "Place", name: photo.location },
  };

  return (
    <PageShell>
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Container className="pt-10 sm:pt-16 lg:pt-20">
          <figure>
            <div
              className="bg-muted relative mx-auto max-h-[82svh] w-full overflow-hidden"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes="100vw"
                className="object-contain"
                placeholder="blur"
                blurDataURL={image.blurDataURL}
              />
            </div>
          </figure>

          <div className="mx-auto mt-14 grid max-w-6xl gap-14 lg:mt-20 lg:grid-cols-[1fr_0.62fr] lg:gap-24">
            <article>
              <p className="text-muted-foreground text-[0.68rem] tracking-[0.22em] uppercase">
                {photo.series} · {formattedDate}
              </p>
              <h1 className="mt-5 font-serif text-5xl tracking-[-0.045em] sm:text-7xl">
                {photo.title}
              </h1>
              <div className="photo-story text-muted-foreground mt-10 max-w-2xl text-lg leading-8">
                <MDXRemote source={photo.story} />
              </div>
            </article>

            <aside className="lg:pt-12">
              <dl className="border-border border-t text-sm">
                {[
                  ["Location", photo.location],
                  ["Date", formattedDate],
                  ["Camera", photo.camera],
                  ["Lens", photo.lens],
                  ["Series", photo.series],
                ].map(([term, value]) => (
                  <div
                    key={term}
                    className="border-border grid grid-cols-[0.65fr_1fr] gap-5 border-b py-4"
                  >
                    <dt className="text-muted-foreground">{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                {photo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border-border text-muted-foreground rounded-full border px-3 py-1.5 text-[0.62rem] tracking-[0.13em] uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
                <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                  <MapPin className="size-4" />
                  {photo.location}
                </span>
                <ShareButton title={`${photo.title} — ${siteConfig.name}`} />
              </div>
            </aside>
          </div>

          <nav
            className="border-border mx-auto mt-24 grid max-w-6xl border-y sm:grid-cols-2 lg:mt-36"
            aria-label="Photo navigation"
          >
            <Link
              href={`/photos/${previous.slug}`}
              className="group sm:border-border flex items-center gap-5 py-8 sm:border-r sm:pr-8"
            >
              <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
              <span>
                <span className="text-muted-foreground block text-[0.62rem] tracking-[0.17em] uppercase">
                  Previous
                </span>
                <span className="mt-1 block font-serif text-xl">
                  {previous.title}
                </span>
              </span>
            </Link>
            <Link
              href={`/photos/${next.slug}`}
              className="group border-border flex items-center justify-end gap-5 border-t py-8 text-right sm:border-t-0 sm:pl-8"
            >
              <span>
                <span className="text-muted-foreground block text-[0.62rem] tracking-[0.17em] uppercase">
                  Next
                </span>
                <span className="mt-1 block font-serif text-xl">
                  {next.title}
                </span>
              </span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </nav>
        </Container>
      </main>
    </PageShell>
  );
}
