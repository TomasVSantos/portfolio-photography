import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { PhotoCard } from "@/components/photo/photo-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPhotoImage } from "@/lib/images";
import { getAllPhotos, getAllSeries } from "@/lib/photos";

export default function Home() {
  const photos = getAllPhotos();
  const heroPhoto =
    photos.find((photo) => photo.slug === "culatra-lighthouse") ?? photos[0];
  const featured = photos.filter((photo) => photo.featured).slice(0, 3);
  const latestSeries = getAllSeries()[0];
  const latestImage = getPhotoImage(latestSeries.photos[0]);
  const heroImage = getPhotoImage(heroPhoto);

  return (
    <PageShell>
      <main>
        <Container className="pt-10 sm:pt-16 lg:pt-20">
          <section className="grid min-h-[calc(100svh-8rem)] items-center gap-10 pb-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <Reveal>
              <p className="text-muted-foreground text-[0.68rem] tracking-[0.24em] uppercase">
                Portugal · 2026
              </p>
              <h1 className="mt-6 font-serif text-[clamp(4rem,9vw,8.5rem)] leading-[0.78] font-normal tracking-[-0.065em]">
                Tomás
                <br />
                Santos
              </h1>
              <div className="text-muted-foreground mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[0.67rem] tracking-[0.18em] uppercase">
                <span>Software Engineer</span>
                <span aria-hidden="true">—</span>
                <span>Hobby Photographer</span>
              </div>
              <p className="text-muted-foreground mt-8 max-w-md text-base leading-7">
                Observations from the places between arrival and
                departure—photographs of people, light, and the quiet details
                that hold a place together.
              </p>
              <Link
                href="/gallery"
                className="mt-10 inline-flex items-center gap-3 text-xs tracking-[0.17em] uppercase hover:opacity-60"
              >
                Enter the gallery <ArrowRight className="size-4" />
              </Link>
            </Reveal>

            <Reveal
              delay={0.1}
              className="w-full max-w-[560px] lg:justify-self-end"
            >
              <div className="bg-muted relative mx-auto aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={heroImage.blurDataURL}
                />
              </div>
              <div className="text-muted-foreground mt-3 flex justify-between gap-6 text-[0.62rem] tracking-[0.15em] uppercase">
                <span>{heroPhoto.title}</span>
                <span>{heroPhoto.location}</span>
              </div>
            </Reveal>
          </section>
        </Container>

        <section className="border-border/70 border-y py-24 lg:py-36">
          <Container>
            <Reveal className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <SectionHeading eyebrow="Selected photographs">
                Featured work
              </SectionHeading>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 text-xs tracking-[0.16em] uppercase hover:opacity-60"
              >
                View all <ArrowRight className="size-4" />
              </Link>
            </Reveal>
            <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
              {featured.map((photo, index) => (
                <Reveal key={photo.slug} delay={index * 0.06}>
                  <PhotoCard photo={photo} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        <Container>
          <section className="grid items-center gap-12 py-24 lg:grid-cols-[1.25fr_0.75fr] lg:gap-24 lg:py-40">
            <Reveal>
              <Link
                href={`/series/${latestSeries.slug}`}
                className="group bg-muted block overflow-hidden"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={latestImage.src}
                    alt={latestImage.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                    placeholder="blur"
                    blurDataURL={latestImage.blurDataURL}
                  />
                </div>
              </Link>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-muted-foreground text-[0.68rem] tracking-[0.22em] uppercase">
                Latest series ·{" "}
                {latestSeries.photos.length.toString().padStart(2, "0")}
              </p>
              <h2 className="mt-6 font-serif text-5xl tracking-[-0.045em] sm:text-6xl">
                {latestSeries.name}
              </h2>
              <p className="text-muted-foreground mt-7 max-w-sm text-base leading-7">
                A walk through an island shaped by tides, work, and the distance
                between harbour and Atlantic.
              </p>
              <Link
                href={`/series/${latestSeries.slug}`}
                className="mt-9 inline-flex items-center gap-3 text-xs tracking-[0.17em] uppercase hover:opacity-60"
              >
                View the series <ArrowRight className="size-4" />
              </Link>
            </Reveal>
          </section>

          <section className="border-border grid gap-10 border-t py-24 lg:grid-cols-2 lg:gap-24 lg:py-36">
            <Reveal>
              <SectionHeading eyebrow="Behind the camera">
                The work begins with paying attention.
              </SectionHeading>
            </Reveal>
            <Reveal delay={0.08} className="max-w-xl lg:pt-10">
              <p className="text-muted-foreground text-lg leading-8">
                I’m a Software Engineer from Portugal with a growing passion for
                documentary, travel, and street photography. The camera is how I
                slow down, look longer, and keep a small record of ordinary
                life.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center gap-3 text-xs tracking-[0.17em] uppercase hover:opacity-60"
              >
                About Tomás <ArrowRight className="size-4" />
              </Link>
            </Reveal>
          </section>
        </Container>
      </main>
    </PageShell>
  );
}
