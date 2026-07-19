import Link from "next/link";

import { siteConfig } from "@/config/site";

import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="border-border/80 mt-28 border-t py-10 lg:mt-40">
      <Container className="text-muted-foreground flex flex-col gap-6 text-xs tracking-[0.12em] uppercase sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Tomás Santos</p>
        <div className="flex gap-6">
          <a
            href={`mailto:${siteConfig.email}`}
            className="hover:text-foreground transition-colors"
          >
            Email
          </a>
          <Link
            href="/contact"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </div>
      </Container>
    </footer>
  );
}
