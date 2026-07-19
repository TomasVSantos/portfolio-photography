"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Minus,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export interface GalleryItem {
  slug: string;
  title: string;
  location: string;
  series: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export function GalleryLightbox({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const showPrevious = useCallback(() => {
    setZoom(1);
    setActive((current) =>
      current === null ? null : (current - 1 + items.length) % items.length,
    );
  }, [items.length]);

  const showNext = useCallback(() => {
    setZoom(1);
    setActive((current) =>
      current === null ? null : (current + 1) % items.length,
    );
  }, [items.length]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (active === null) return;
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, showNext, showPrevious]);

  const item = active === null ? null : items[active];

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {items.map((photo, index) => (
          <article key={photo.slug} className="group">
            <button
              type="button"
              onClick={() => setActive(index)}
              className="bg-muted focus-visible:outline-foreground block w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-4"
              aria-label={`Open ${photo.title} in lightbox`}
            >
              <span className="relative block aspect-[4/3] overflow-hidden">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  placeholder="blur"
                  blurDataURL={photo.blurDataURL}
                />
              </span>
            </button>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/photos/${photo.slug}`}
                  className="font-serif text-xl tracking-[-0.02em] hover:opacity-60"
                >
                  {photo.title}
                </Link>
                <p className="text-muted-foreground mt-1 text-xs tracking-[0.08em]">
                  {photo.location}
                </p>
              </div>
              <p className="text-muted-foreground pt-1 text-[0.65rem] tracking-[0.18em] uppercase">
                {photo.series}
              </p>
            </div>
          </article>
        ))}
      </div>

      <Dialog.Root
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
      >
        <AnimatePresence>
          {item && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-[#0b0b0a]/98"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild onEscapeKeyDown={() => setActive(null)}>
                <motion.div
                  className="fixed inset-0 z-50 flex flex-col text-white outline-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Dialog.Title className="sr-only">{item.title}</Dialog.Title>
                  <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
                    <p className="truncate font-serif text-lg">{item.title}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setZoom((value) => Math.max(1, value - 0.5))
                        }
                        className="grid size-10 place-items-center rounded-full hover:bg-white/10"
                        aria-label="Zoom out"
                      >
                        <Minus className="size-4" />
                      </button>
                      <button
                        onClick={() =>
                          setZoom((value) => Math.min(3, value + 0.5))
                        }
                        className="grid size-10 place-items-center rounded-full hover:bg-white/10"
                        aria-label="Zoom in"
                      >
                        <Plus className="size-4" />
                      </button>
                      <Dialog.Close
                        className="grid size-10 place-items-center rounded-full hover:bg-white/10"
                        aria-label="Close lightbox"
                      >
                        <X className="size-5" />
                      </Dialog.Close>
                    </div>
                  </div>

                  <div className="relative min-h-0 flex-1 overflow-hidden px-4 sm:px-16">
                    <button
                      onClick={showPrevious}
                      className="absolute top-1/2 left-2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/5 hover:bg-white/10 sm:grid"
                      aria-label="Previous photograph"
                    >
                      <ArrowLeft className="size-5" />
                    </button>
                    <button
                      onClick={showNext}
                      className="absolute top-1/2 right-2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/5 hover:bg-white/10 sm:grid"
                      aria-label="Next photograph"
                    >
                      <ArrowRight className="size-5" />
                    </button>

                    <motion.div
                      key={item.slug}
                      drag={zoom === 1 ? "x" : true}
                      dragConstraints={
                        zoom === 1 ? { left: 0, right: 0 } : undefined
                      }
                      dragElastic={zoom === 1 ? 0.25 : 0.08}
                      onDragEnd={(_, info) => {
                        if (zoom !== 1) return;
                        if (info.offset.x > 90) showPrevious();
                        if (info.offset.x < -90) showNext();
                      }}
                      onDoubleClick={() =>
                        setZoom((value) => (value === 1 ? 2 : 1))
                      }
                      onWheel={(event) =>
                        setZoom((value) =>
                          Math.min(
                            3,
                            Math.max(1, value - event.deltaY * 0.002),
                          ),
                        )
                      }
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: 1, scale: zoom }}
                      transition={{
                        opacity: { duration: 0.25 },
                        scale: { type: "spring", stiffness: 240, damping: 28 },
                      }}
                      className="relative h-full w-full cursor-zoom-in touch-none"
                    >
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        priority
                        sizes="100vw"
                        className="object-contain"
                      />
                    </motion.div>
                  </div>

                  <div className="flex h-20 shrink-0 items-center justify-between px-5 text-xs tracking-[0.12em] text-white/65 uppercase sm:px-8">
                    <span>{item.location}</span>
                    <Link
                      href={`/photos/${item.slug}`}
                      className="flex items-center gap-2 text-white transition-opacity hover:opacity-60"
                    >
                      View story <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
