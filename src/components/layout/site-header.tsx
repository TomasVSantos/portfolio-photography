"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navigation } from "@/config/site";
import { cn } from "@/lib/utils";

import { Container } from "./container";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="border-border/70 bg-background/90 relative z-40 border-b backdrop-blur-sm">
      <Container className="flex h-20 items-center justify-between lg:h-24">
        <Link
          href="/"
          className="font-serif text-xl tracking-[-0.02em]"
          aria-label="Tomás Santos, home"
        >
          Tomás Santos
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2 text-xs tracking-[0.16em] uppercase transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="bg-foreground absolute inset-x-0 -bottom-0.5 h-px"
                    transition={{ duration: 0.25 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          className="grid size-10 place-items-center md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-border bg-background overflow-hidden border-t md:hidden"
            aria-label="Mobile navigation"
          >
            <Container className="flex flex-col py-5">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-border/60 border-b py-5 text-2xl font-light"
                >
                  {item.label}
                </Link>
              ))}
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
