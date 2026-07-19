export interface EditorialValidationResult {
  draft: boolean;
  errors: string[];
}

export function isValidPhotoDate(value: unknown): boolean;
export function validateEditorialData(
  data: Record<string, unknown>,
  slug: string,
): EditorialValidationResult;
