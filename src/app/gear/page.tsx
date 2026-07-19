import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Gear",
  description: "The cameras and lenses Tomás Santos uses for his photography.",
};

const currentGear = [
  {
    name: "Fujifilm X100VI",
    note: "The everyday camera. Small, familiar, and always close.",
  },
  {
    name: "Fujifilm X-T5",
    note: "For slower work and the flexibility of interchangeable lenses.",
  },
  {
    name: "XF 35mm f/1.4 R",
    note: "A compact, characterful lens for people and low light.",
  },
  {
    name: "iPhone 17 Pro",
    note: "The camera that removes every excuse not to make a photograph.",
  },
];

const wishlist = [
  "Fujifilm GF 50mm f/3.5",
  "A compact film rangefinder",
  "More time in good light",
];

export default function GearPage() {
  return (
    <PageShell>
      <main>
        <Container className="py-20 sm:py-28 lg:py-36">
          <SectionHeading eyebrow="Tools, not trophies">Gear</SectionHeading>
          <p className="text-muted-foreground mt-7 max-w-xl text-base leading-7">
            The camera matters far less than attention, but these are the tools
            I enjoy carrying. A small kit leaves more room for the photograph.
          </p>

          <div className="mt-20 grid gap-16 lg:mt-28 lg:grid-cols-2 lg:gap-28">
            <Reveal>
              <h2 className="text-muted-foreground text-xs tracking-[0.19em] uppercase">
                Current gear
              </h2>
              <div className="border-border mt-7 border-t">
                {currentGear.map((item) => (
                  <div
                    key={item.name}
                    className="border-border grid gap-2 border-b py-7 sm:grid-cols-[0.7fr_1.3fr] sm:gap-8"
                  >
                    <h3 className="font-serif text-xl">{item.name}</h3>
                    <p className="text-muted-foreground text-sm leading-6">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 className="text-muted-foreground text-xs tracking-[0.19em] uppercase">
                Future wishlist
              </h2>
              <ol className="border-border mt-7 border-t">
                {wishlist.map((item, index) => (
                  <li
                    key={item}
                    className="border-border flex items-center gap-6 border-b py-7"
                  >
                    <span className="text-muted-foreground text-[0.65rem] tracking-[0.17em]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-xl">{item}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </Container>
      </main>
    </PageShell>
  );
}
