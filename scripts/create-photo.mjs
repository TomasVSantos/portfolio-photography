import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";

import matter from "gray-matter";

import { photoCategories } from "../src/config/photo-categories.mjs";
import { isValidPhotoDate } from "../src/lib/photo-editorial.mjs";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const options = {};
let force = false;
for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === "--force") {
    force = true;
    continue;
  }
  if (argument.startsWith("--")) {
    const key = argument.slice(2);
    options[key] = args[index + 1];
    index += 1;
  }
}

const questions = [
  ["slug", "Slug"],
  ["title", "Title"],
  ["date", "Date (YYYY-MM-DD)"],
  ["location", "Location"],
  ["series", "Series"],
  ["category", `Category (${photoCategories.join(", ")})`],
  ["tags", "Tags (comma-separated)"],
  ["alt", "Alt text"],
];

const missing = questions.filter(([key]) => !options[key]);
if (missing.length > 0 && !process.stdin.isTTY) {
  console.error(
    `Missing arguments: ${missing.map(([key]) => `--${key}`).join(", ")}. Run pnpm photo:new interactively or provide all arguments.`,
  );
  process.exit(1);
}

if (missing.length > 0) {
  const input = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  for (const [key, label] of missing)
    options[key] = await input.question(`${label}: `);
  input.close();
}

const slug = String(options.slug ?? "").trim();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(
    "Slug must contain lowercase letters, numbers, and single hyphens only.",
  );
  process.exit(1);
}
if (!isValidPhotoDate(String(options.date))) {
  console.error("Date must be a real calendar date in YYYY-MM-DD format.");
  process.exit(1);
}
if (!photoCategories.includes(options.category)) {
  console.error(`Category must be one of: ${photoCategories.join(", ")}.`);
  process.exit(1);
}

const contentDirectory = path.join(process.cwd(), "src/content/photos", slug);
const publicDirectory = path.join(process.cwd(), "public/photos", slug);
const mdxPath = path.join(contentDirectory, "page.mdx");
async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
if (
  !force &&
  ((await exists(contentDirectory)) || (await exists(publicDirectory)))
) {
  console.error(
    `[${slug}] A content or public photo folder already exists. Pass --force to replace its MDX template without deleting image files.`,
  );
  process.exit(1);
}

await mkdir(contentDirectory, { recursive: true });
await mkdir(publicDirectory, { recursive: true });
const tags = String(options.tags ?? "")
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);
const frontmatter = {
  title: String(options.title).trim(),
  location: String(options.location).trim(),
  date: String(options.date),
  series: String(options.series).trim(),
  category: options.category,
  featured: false,
  draft: true,
  tags,
  alt: String(options.alt ?? "").trim(),
};
const file = matter.stringify(
  "Replace this paragraph with the photograph's story. Remove `draft: true` when the metadata, story, and generated image assets are ready.\n",
  frontmatter,
);
await writeFile(mdxPath, file);

console.log(`Created ${path.relative(process.cwd(), mdxPath)}.`);
console.log(
  `Place the original at public/photos/${slug}/source.jpg (or another supported source extension).`,
);
console.log(`Then run: pnpm images:build -- ${slug}`);
