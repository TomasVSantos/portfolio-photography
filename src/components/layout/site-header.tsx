"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { navigation } from "@/config/site";
import { cn } from "@/lib/utils";

import { Container } from "./container";

const GlobalSearch = dynamic(() =>
  import("@/components/search/global-search").then(
    (module) => module.GlobalSearch,
  ),
);

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchReady, setSearchReady] = useState(false);

  const openSearch = useCallback(() => {
    setSearchReady(true);
    setSearchOpen(true);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";
      const commandK =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      const slash =
        event.key === "/" &&
        !isTyping &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;

      if (commandK || slash) {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape" && searchOpen) setSearchOpen(false);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [openSearch, searchOpen]);

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
          <button
            type="button"
            onClick={openSearch}
            onMouseEnter={() => setSearchReady(true)}
            onFocus={() => setSearchReady(true)}
            className="text-muted-foreground hover:text-foreground border-border/70 ml-1 inline-flex items-center gap-2 border-l py-2 pl-7 text-xs tracking-[0.14em] uppercase transition-colors"
            aria-label="Search portfolio"
          >
            <Search className="size-3.5" />
            <span>Search</span>
            <kbd className="border-border ml-1 border px-1.5 py-0.5 text-[0.55rem] tracking-normal normal-case opacity-65">
              ⌘K
            </kbd>
          </button>
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
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openSearch();
                }}
                className="border-border/60 text-muted-foreground flex items-center justify-between border-b py-5 text-left text-2xl font-light"
              >
                Search
                <Search className="size-5" />
              </button>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
      {searchReady && (
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      )}
    </header>
  );
}
