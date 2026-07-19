import { photoCategories } from "../config/photo-categories.mjs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPhotoDate(value) {
  if (value instanceof Date) return !Number.isNaN(value.valueOf());
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateEditorialData(data, slug) {
  const errors = [];
  const draft = data.draft === true;

  if (data.date !== undefined && !isValidPhotoDate(data.date)) {
    errors.push(
      `[${slug}] Invalid date "${String(data.date)}"; expected YYYY-MM-DD.`,
    );
  }
  if (data.category !== undefined && !photoCategories.includes(data.category)) {
    errors.push(
      `[${slug}] Unsupported category "${String(data.category)}". Expected one of: ${photoCategories.join(", ")}.`,
    );
  }
  if (draft) return { draft, errors };

  const required = [
    "title",
    "date",
    "location",
    "series",
    "category",
    "tags",
    "alt",
    "featured",
  ];
  for (const field of required) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      errors.push(`[${slug}] Missing required frontmatter field: ${field}`);
    }
  }
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    errors.push(
      `[${slug}] Frontmatter field "tags" must contain at least one tag.`,
    );
  }
  if (typeof data.alt !== "string" || data.alt.trim() === "") {
    errors.push(`[${slug}] Frontmatter field "alt" must be non-empty.`);
  }
  if (data.featured !== undefined && typeof data.featured !== "boolean") {
    errors.push(
      `[${slug}] Frontmatter field "featured" must be true or false.`,
    );
  }
  if (
    data.order !== undefined &&
    (!Number.isInteger(data.order) || data.order < 0)
  ) {
    errors.push(
      `[${slug}] Frontmatter field "order" must be a non-negative integer.`,
    );
  }

  return { draft, errors };
}
