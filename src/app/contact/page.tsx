import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Tomás Santos about photography, collaborations, or print enquiries.",
};

const contacts = [
  {
    label: "Email",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
  },
  { label: "Instagram", value: "@tomassantos", href: siteConfig.instagram },
  { label: "GitHub", value: "tomassantos", href: siteConfig.github },
];

export default function ContactPage() {
  return (
    <PageShell>
      <main>
        <Container className="flex min-h-[calc(100svh-16rem)] items-center py-20 sm:py-28">
          <Reveal className="w-full">
            <p className="text-muted-foreground text-[0.68rem] tracking-[0.22em] uppercase">
              Contact
            </p>
            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              A conversation can begin simply.
            </h1>
            <div className="border-border mt-16 max-w-3xl border-t lg:mt-24">
              {contacts.map((contact) => (
                <a
                  key={contact.label}
                  href={contact.href}
                  target={
                    contact.href.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    contact.href.startsWith("http") ? "noreferrer" : undefined
                  }
                  className="group border-border grid items-center gap-3 border-b py-6 sm:grid-cols-[0.4fr_1fr_auto]"
                >
                  <span className="text-muted-foreground text-[0.65rem] tracking-[0.18em] uppercase">
                    {contact.label}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl">
                    {contact.value}
                  </span>
                  <ArrowUpRight className="hidden size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:block" />
                </a>
              ))}
            </div>
          </Reveal>
        </Container>
      </main>
    </PageShell>
  );
}
