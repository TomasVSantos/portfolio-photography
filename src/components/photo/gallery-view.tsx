"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import {
  filterGalleryItems,
  formatFilterValue,
  getGalleryFilters,
  type GalleryFilterKey,
} from "@/lib/gallery-filter";

import { GalleryLightbox, type GalleryItem } from "./gallery-lightbox";

const filterLabels: Record<GalleryFilterKey, string> = {
  series: "Series",
  category: "Category",
  year: "Year",
  location: "Location",
  tag: "Tag",
};

export function GalleryView({ items }: { items: GalleryItem[] }) {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => getGalleryFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const filteredItems = useMemo(
    () => filterGalleryItems(items, filters),
    [filters, items],
  );
  const activeFilters = Object.entries(filters) as [GalleryFilterKey, string][];

  return (
    <>
      {activeFilters.length > 0 && (
        <div className="border-border mb-12 flex flex-col gap-4 border-y py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-muted-foreground tracking-[0.15em] uppercase">
              Showing {filteredItems.length} of {items.length}
            </span>
            {activeFilters.map(([key, value]) => (
              <span key={key} className="border-border border-l pl-3">
                <span className="text-muted-foreground">
                  {filterLabels[key]}
                </span>{" "}
                {formatFilterValue(value)}
              </span>
            ))}
          </div>
          <Link
            href="/gallery"
            className="self-start tracking-[0.14em] uppercase transition-opacity hover:opacity-55 sm:self-auto"
          >
            Clear filter
          </Link>
        </div>
      )}

      {filteredItems.length > 0 ? (
        <GalleryLightbox items={filteredItems} />
      ) : (
        <div className="border-border border-y py-24 text-center">
          <p className="font-serif text-3xl">No photographs here yet</p>
          <p className="text-muted-foreground mt-3 text-sm">
            Try clearing the filter or searching the wider portfolio.
          </p>
          <Link
            href="/gallery"
            className="mt-8 inline-block text-xs tracking-[0.16em] uppercase hover:opacity-60"
          >
            View all photographs
          </Link>
        </div>
      )}
    </>
  );
}
