/**
 * Ensures an image URL is absolute.
 * Cloudinary stores paths like `image/upload/v.../file.jpg` (without the base domain).
 * This helper prepends the full Cloudinary base URL when needed.
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  // Already an absolute URL — use as-is
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Relative Cloudinary path — prepend the CDN base
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName) {
    return `https://res.cloudinary.com/${cloudName}/${url}`;
  }
  // Fallback: just return the path (won't work, but avoids a hard crash)
  return url;
}
