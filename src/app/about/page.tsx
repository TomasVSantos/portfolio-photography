import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { getPhotoImage } from "@/lib/images";
import { getPhoto } from "@/lib/photos";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Tomás Santos and his developing interest in everyday life, travel, and live music photography.",
};

export default function AboutPage() {
  const photo = getPhoto("culatra-under-the-trees")!;
  const image = getPhotoImage(photo);

  return (
    <PageShell>
      <main>
        <Container className="py-20 sm:py-28 lg:py-36">
          <div className="grid items-start gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <Reveal>
              <p className="text-muted-foreground text-[0.68rem] tracking-[0.22em] uppercase">
                About
              </p>
              <h1 className="mt-6 font-serif text-5xl leading-[0.95] tracking-[-0.045em] sm:text-7xl">
                Looking is a way of slowing down.
              </h1>
              <div className="text-muted-foreground mt-10 max-w-lg space-y-6 text-lg leading-8">
                <p>
                  I’m Tomás, a Software Engineer from Portugal and a hobby
                  photographer still developing my eye.
                </p>
                <p>
                  I started taking photography more seriously as a way to keep a
                  record of places I visited and details I would otherwise
                  forget. It became a reason to slow down, look longer, and pay
                  closer attention to ordinary life.
                </p>
                <p>
                  Music has been part of my life for much longer than
                  photography, so the camera is beginning to follow me towards
                  concerts too. The performers, the rooms, and the energy around
                  a stage. This collection leaves room for both the quiet walks
                  and the louder nights.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-muted relative aspect-[4/5] overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                />
              </div>
              <p className="text-muted-foreground mt-3 text-[0.62rem] tracking-[0.16em] uppercase">
                Culatra, Portugal · 2026
              </p>
            </Reveal>
          </div>
        </Container>
      </main>
    </PageShell>
  );
}
