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
import { formatFilterValue } from "@/lib/gallery-filter";
import { getPhotoImage } from "@/lib/images";
import { getAllPhotos, getPhoto, getPhotoNeighbors } from "@/lib/photos";
import { getLocationSlug, slugify } from "@/lib/slugs";

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
  const year = photo.date.slice(0, 4);
  const metadataRows = [
    {
      term: "Location",
      value: photo.location,
      href: `/gallery?location=${getLocationSlug(photo.location)}`,
    },
    ...(photo.venue
      ? [{ term: "Venue", value: photo.venue, href: undefined }]
      : []),
    {
      term: "Date",
      value: formattedDate,
      href: `/gallery?year=${year}`,
    },
    { term: "Camera", value: photo.camera, href: undefined },
    { term: "Lens", value: photo.lens, href: undefined },
    {
      term: "Series",
      value: photo.series,
      href: `/gallery?series=${slugify(photo.series)}`,
    },
    ...(photo.category
      ? [
          {
            term: "Category",
            value: formatFilterValue(photo.category),
            href: `/gallery?category=${photo.category}`,
          },
        ]
      : []),
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Photograph",
    name: photo.title,
    description: photo.story.split("\n")[0],
    contentUrl: `${siteConfig.url}${image.src}`,
    dateCreated: photo.date,
    keywords: [...photo.tags, ...(photo.category ? [photo.category] : [])].join(
      ", ",
    ),
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
                <Link
                  href={`/gallery?series=${slugify(photo.series)}`}
                  className="hover:text-foreground transition-colors"
                >
                  {photo.series}
                </Link>{" "}
                ·{" "}
                <Link
                  href={`/gallery?year=${year}`}
                  className="hover:text-foreground transition-colors"
                >
                  {formattedDate}
                </Link>
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
                {metadataRows.map(({ term, value, href }) => (
                  <div
                    key={term}
                    className="border-border grid grid-cols-[0.65fr_1fr] gap-5 border-b py-4"
                  >
                    <dt className="text-muted-foreground">{term}</dt>
                    <dd>
                      {href ? (
                        <Link
                          href={href}
                          className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
                        >
                          {value}
                        </Link>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                {photo.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/gallery?tag=${slugify(tag)}`}
                    className="border-border text-muted-foreground rounded-full border px-3 py-1.5 text-[0.62rem] tracking-[0.13em] uppercase"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
                <Link
                  href={`/gallery?location=${getLocationSlug(photo.location)}`}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs transition-colors"
                >
                  <MapPin className="size-4" />
                  {photo.location}
                </Link>
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
