/**
 * cdn.js — Responsive Image & CDN Delivery Helper (NFR-PERF-04, 5.2.3)
 *
 * Transforms raw image URLs into optimized, responsive CDN URLs with
 * width parameters and WebP auto-formatting rather than serving raw originals.
 */

const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.shopsphere.example.com';

/**
 * Generate a CDN delivery URL for a specific width and format
 * @param {string} rawUrl - Original storage URL
 * @param {number} width - Desired pixel width
 * @param {string} format - webp | avif | auto
 */
function getCdnImageUrl(rawUrl, width = 800, format = 'webp') {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('data:')) return rawUrl; // Inline data URLs unchanged

  // If already a CDN URL or cloud storage URL, append transformation query
  const cleanUrl = rawUrl.replace(/^https?:\/\/[^/]+/, CDN_BASE_URL);
  const separator = cleanUrl.includes('?') ? '&' : '?';
  return `${cleanUrl}${separator}w=${width}&auto=format&format=${format}&q=80`;
}

/**
 * Generate standard responsive srcset string for HTML <img> or <picture>
 * Sizes: 320w (mobile), 640w (tablet), 1024w (desktop)
 */
function generateSrcSet(rawUrl) {
  if (!rawUrl) return '';
  const widths = [320, 640, 1024];
  return widths
    .map(w => `${getCdnImageUrl(rawUrl, w)} ${w}w`)
    .join(', ');
}

module.exports = {
  getCdnImageUrl,
  generateSrcSet,
};
