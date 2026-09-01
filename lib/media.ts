const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_CMS_MEDIA_URL ?? "https://cms.kakaadebasodara.com/files";

/**
 * Resolves a relative path like "2026/09/xxxx.webp" returned by the CMS
 * into a full URL. Falls back to a local placeholder if null.
 */
export function resolveMediaUrl(path: string | null): string {
  if (!path) return "/placeholder-image.png";
  if (path.startsWith("http")) return path; // already absolute, pass through
  return `${MEDIA_BASE_URL}/${path}`;
}
