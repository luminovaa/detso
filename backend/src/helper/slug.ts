/**
 * Create a URL-friendly slug from a string.
 */
export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};
