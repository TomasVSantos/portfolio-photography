import Image from "next/image";
import Link from "next/link";

import { getPhotoImage } from "@/lib/images";
import type { Photo } from "@/types/photo";

export function PhotoCard({
  photo,
  priority = false,
}: {
  photo: Photo;
  priority?: boolean;
}) {
  const image = getPhotoImage(photo);

  return (
    <article className="group">
      <Link
        href={`/photos/${photo.slug}`}
        className="bg-muted block overflow-hidden"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
            placeholder="blur"
            blurDataURL={image.blurDataURL}
          />
        </div>
      </Link>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl tracking-[-0.02em]">
            {photo.title}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs tracking-[0.08em]">
            {photo.location}
          </p>
        </div>
        <p className="text-muted-foreground pt-1 text-[0.65rem] tracking-[0.18em] uppercase">
          {photo.series}
        </p>
      </div>
    </article>
  );
}
