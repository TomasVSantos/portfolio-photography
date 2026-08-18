import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPhotoImage } from "@/lib/images";
import { getAllSeries, getSeriesDateRange } from "@/lib/photos";
import {
  createPageMetadata,
  getPhotoMetadataImage,
  getSeriesDescription,
} from "@/lib/seo";

const allSeries = getAllSeries();
const seriesCover = allSeries[0]
  ? getPhotoMetadataImage(getPhotoImage(allSeries[0].coverPhoto))
  : undefined;

export const metadata: Metadata = createPageMetadata({
  title: "Series",
  description:
    "Photographic series by Tomás Santos, ordered from the most recent work to the earliest.",
  pathname: "/series",
  image: seriesCover,
});

function formatSeriesDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatSeriesDateRange(series: (typeof allSeries)[number]) {
  const { start, end } = getSeriesDateRange(series);
  if (!start) return "";
  if (start === end) return formatSeriesDate(start);
  return `${formatSeriesDate(start)} – ${formatSeriesDate(end)}`;
}

export default function SeriesIndexPage() {
  const series = getAllSeries();

  return (
    <PageShell>
      <main>
        <Container>
          <header className="max-w-3xl py-20 sm:py-28 lg:py-36">
            <SectionHeading
              eyebrow={`${series.length.toString().padStart(2, "0")} series`}
            >
              Series
            </SectionHeading>
            <p className="text-muted-foreground mt-7 max-w-lg text-base leading-7">
              The work, one series at a time.
            </p>
          </header>

          <section className="border-border border-t pt-14 pb-24 lg:pt-20 lg:pb-36">
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:gap-x-10 lg:gap-y-24">
              {series.map((item) => {
                const image = getPhotoImage(item.coverPhoto);

                return (
                  <article key={item.slug} className="group">
                    <Link
                      href={`/series/${item.slug}`}
                      className="bg-muted block overflow-hidden"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                          placeholder="blur"
                          blurDataURL={image.blurDataURL}
                        />
                      </div>
                    </Link>
                    <div className="mt-5 flex items-start justify-between gap-6">
                      <div>
                        <p className="text-muted-foreground text-[0.62rem] tracking-[0.16em] uppercase">
                          {formatSeriesDateRange(item)} ·{" "}
                          {item.photos.length.toString().padStart(2, "0")}
                        </p>
                        <h2 className="mt-3 font-serif text-3xl tracking-[-0.035em]">
                          <Link
                            href={`/series/${item.slug}`}
                            className="hover:opacity-60"
                          >
                            {item.name}
                          </Link>
                        </h2>
                        <p className="text-muted-foreground mt-3 max-w-md text-sm leading-6">
                          {getSeriesDescription(item)}
                        </p>
                      </div>
                      <Link
                        href={`/series/${item.slug}`}
                        className="text-muted-foreground hover:text-foreground shrink-0 pt-1 text-[0.62rem] tracking-[0.16em] uppercase transition-colors"
                      >
                        Enter
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </Container>
      </main>
    </PageShell>
  );
}
