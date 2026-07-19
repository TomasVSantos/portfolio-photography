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
    "About Tomás Santos and his approach to documentary, travel, and street photography.",
};

export default function AboutPage() {
  const photo = getPhoto("culatra-fisherman")!;
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
                  I’m Tomás, a Software Engineer from Portugal with a growing
                  passion for documentary, travel, and street photography.
                </p>
                <p>
                  Photography gives me a different relationship with time. It
                  asks me to notice the gesture at the edge of the frame, the
                  way light reorganises a familiar street, or the small evidence
                  of work left behind in a place.
                </p>
                <p>
                  This collection is an evolving record of those observations.
                  Made while travelling, walking close to home, and learning to
                  trust quieter photographs.
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
