import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "public/photos");
const widths = [256, 384, 480, 768, 1024, 1536];
const folders = await readdir(root, { withFileTypes: true });

for (const folder of folders.filter((entry) => entry.isDirectory())) {
  const source = path.join(root, folder.name, "image.png");
  const directory = path.dirname(source);

  await sharp(source)
    .webp({ quality: 84, effort: 5 })
    .toFile(path.join(directory, "image.webp"));

  await Promise.all(
    widths.map((width) =>
      sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 })
        .toFile(path.join(directory, `image-${width}.webp`)),
    ),
  );
}

console.log(
  `Generated ${widths.length + 1} WebP assets for ${folders.length} photographs.`,
);
