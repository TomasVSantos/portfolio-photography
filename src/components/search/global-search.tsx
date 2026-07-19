"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Clock3, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";

import { searchIndex } from "@/lib/search";
import type {
  RankedSearchResult,
  SearchIndexItem,
  SearchResultKind,
} from "@/types/search";

const recentSearchesKey = "photography-recent-searches";
const groupOrder: SearchResultKind[] = ["photo", "series", "page"];
const groupLabels: Record<SearchResultKind, string> = {
  photo: "Photographs",
  series: "Series",
  page: "Pages",
};

let indexRequest: Promise<SearchIndexItem[]> | undefined;

function loadIndex() {
  indexRequest ??= fetch("/search-index.json").then((response) => {
    if (!response.ok) throw new Error("Unable to load search index.");
    return response.json() as Promise<SearchIndexItem[]>;
  });
  return indexRequest;
}

function readRecentSearches() {
  try {
    const value = JSON.parse(localStorage.getItem(recentSearchesKey) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function Highlight({ children, query }: { children: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return children;

  const pattern = new RegExp(
    `(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  return children.split(pattern).map((part, index) =>
    terms.some((term) => part.toLowerCase() === term.toLowerCase()) ? (
      <mark
        key={`${part}-${index}`}
        className="bg-transparent text-inherit underline decoration-current/30 underline-offset-4"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    ),
  );
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setRecentSearches(readRecentSearches());
    setLoading(true);
    setError(false);
    loadIndex()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const results = useMemo(
    () => searchIndex(items, query).slice(0, 18),
    [items, query],
  );
  const grouped = useMemo(
    () =>
      groupOrder
        .map((kind) => ({
          kind,
          items: results.filter((item) => item.kind === kind),
        }))
        .filter((group) => group.items.length > 0),
    [results],
  );
  const orderedResults = grouped.flatMap((group) => group.items);

  useEffect(() => setActiveIndex(0), [query]);

  function rememberSearch(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [
      normalized,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== normalized.toLowerCase(),
      ),
    ].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem(recentSearchesKey, JSON.stringify(next));
  }

  function openResult(result: RankedSearchResult) {
    rememberSearch(query);
    onOpenChange(false);
    router.push(result.href);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, Math.max(orderedResults.length - 1, 0)),
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter" && orderedResults[activeIndex]) {
      event.preventDefault();
      openResult(orderedResults[activeIndex]);
    }
  }

  let resultIndex = -1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/75"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <motion.div
                className="fixed top-[9svh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 border border-white/15 bg-[#11110f] text-white shadow-2xl outline-none sm:top-[13svh]"
                initial={
                  reduceMotion ? false : { opacity: 0, y: -10, scale: 0.99 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: 0.18 }}
                onAnimationComplete={() => inputRef.current?.focus()}
                aria-describedby="search-description"
              >
                <Dialog.Title className="sr-only">
                  Search the portfolio
                </Dialog.Title>
                <Dialog.Description id="search-description" className="sr-only">
                  Search photographs, series, and pages. Use the arrow keys to
                  move through results and Enter to open one.
                </Dialog.Description>

                <div className="flex items-center border-b border-white/12 px-4 sm:px-5">
                  <Search
                    className="size-4 shrink-0 text-white/45"
                    aria-hidden="true"
                  />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={listboxId}
                    aria-activedescendant={
                      orderedResults[activeIndex]
                        ? `search-result-${orderedResults[activeIndex].id.replace(":", "-")}`
                        : undefined
                    }
                    autoComplete="off"
                    spellCheck="false"
                    placeholder="Search photographs, places, music…"
                    className="h-16 min-w-0 flex-1 bg-transparent px-4 text-base outline-none placeholder:text-white/35"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="grid size-9 place-items-center text-white/50 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <kbd className="hidden border border-white/15 px-2 py-1 text-[0.6rem] tracking-[0.12em] text-white/40 uppercase sm:block">
                      Esc
                    </kbd>
                  )}
                </div>

                <div className="max-h-[min(66svh,34rem)] overflow-y-auto p-2 sm:p-3">
                  {!query && (
                    <div className="px-3 py-8 sm:px-4">
                      {recentSearches.length > 0 ? (
                        <>
                          <p className="mb-4 flex items-center gap-2 text-[0.63rem] tracking-[0.18em] text-white/40 uppercase">
                            <Clock3 className="size-3.5" /> Recent searches
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recentSearches.map((recent) => (
                              <button
                                key={recent}
                                type="button"
                                onClick={() => setQuery(recent)}
                                className="border border-white/12 px-3 py-2 text-xs text-white/65 transition-colors hover:border-white/30 hover:text-white"
                              >
                                {recent}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="max-w-md text-sm leading-6 text-white/45">
                          Try a place, year, camera, series, or a word from a
                          photograph’s story.
                        </p>
                      )}
                    </div>
                  )}

                  {loading && query && (
                    <p className="px-4 py-10 text-center text-sm text-white/45">
                      Preparing the index…
                    </p>
                  )}
                  {error && (
                    <p className="px-4 py-10 text-center text-sm text-white/55">
                      Search is unavailable just now.
                    </p>
                  )}
                  {!loading && !error && query && results.length === 0 && (
                    <div className="px-4 py-12 text-center">
                      <p className="font-serif text-2xl">
                        No photographs found
                      </p>
                      <p className="mt-2 text-sm text-white/45">
                        Try a broader place, subject, or year.
                      </p>
                    </div>
                  )}

                  {query && orderedResults.length > 0 && (
                    <div
                      id={listboxId}
                      role="listbox"
                      aria-label="Search results"
                    >
                      {grouped.map((group) => (
                        <section
                          key={group.kind}
                          aria-labelledby={`search-group-${group.kind}`}
                        >
                          <h2
                            id={`search-group-${group.kind}`}
                            className="px-3 pt-4 pb-2 text-[0.6rem] tracking-[0.2em] text-white/35 uppercase"
                          >
                            {groupLabels[group.kind]}
                          </h2>
                          {group.items.map((result) => {
                            resultIndex += 1;
                            const currentIndex = resultIndex;
                            const active = currentIndex === activeIndex;
                            return (
                              <button
                                key={result.id}
                                id={`search-result-${result.id.replace(":", "-")}`}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onMouseEnter={() =>
                                  setActiveIndex(currentIndex)
                                }
                                onClick={() => openResult(result)}
                                className={`flex w-full items-center gap-4 px-3 py-3 text-left transition-colors ${active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
                              >
                                {result.thumbnail ? (
                                  <span className="relative size-12 shrink-0 overflow-hidden bg-white/5">
                                    <Image
                                      src={result.thumbnail.src}
                                      alt=""
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  </span>
                                ) : (
                                  <span className="grid size-12 shrink-0 place-items-center border border-white/10 font-serif text-lg text-white/35">
                                    {result.kind === "series" ? "S" : "P"}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-serif text-lg">
                                    <Highlight query={query}>
                                      {result.title}
                                    </Highlight>
                                  </span>
                                  <span className="mt-0.5 block truncate text-xs text-white/45">
                                    <Highlight query={query}>
                                      {result.subtitle}
                                    </Highlight>
                                    {result.year ? ` · ${result.year}` : ""}
                                  </span>
                                </span>
                                <ArrowUpRight
                                  className={`size-4 shrink-0 ${active ? "text-white/70" : "text-white/20"}`}
                                />
                              </button>
                            );
                          })}
                        </section>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden items-center justify-between border-t border-white/10 px-5 py-3 text-[0.58rem] tracking-[0.12em] text-white/30 uppercase sm:flex">
                  <span>↑↓ Navigate · Enter Open</span>
                  <span>
                    {query
                      ? `${results.length} result${results.length === 1 ? "" : "s"}`
                      : "Type to search"}
                  </span>
                </div>
                <div className="sr-only" aria-live="polite">
                  {query && !loading ? `${results.length} search results` : ""}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
