import { resolveMediaUrl } from "./media";

/**
 * Utilitas untuk konten rich text HTML dari CMS (dipakai post type `blog`).
 *
 * Konten ditulis penyunting situs sendiri di CMS, jadi HTML-nya dirender apa
 * adanya (WYSIWYG). Fungsi di sini hanya untuk kebutuhan turunan: membuat
 * excerpt berupa teks polos, dan memperbaiki URL media relatif.
 */

/** HTML → teks polos: tag dibuang, entitas umum di-decode, spasi dirapikan. */
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&(?:#0?39|apos);/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Excerpt dari rich text: HTML dibuang lalu dipotong di batas kata. */
export function toExcerpt(html: string, maxLength = 160): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");

  // Potong di spasi terakhir bila tidak terlalu jauh dari batas panjang
  const safeCut = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trimEnd()}…`;
}

/**
 * Ganti `src` gambar relatif di dalam HTML CMS (mis. `2026/09/x.webp`) menjadi
 * URL media penuh. URL absolut (`http`, `data:`, `//`) dibiarkan.
 */
export function rewriteMediaUrls(html: string): string {
  return html.replace(
    /(<img\b[^>]*?\bsrc=")([^"]+)(")/gi,
    (match, prefix: string, src: string, suffix: string) => {
      if (/^(https?:|data:|\/\/)/i.test(src)) return match;
      return `${prefix}${resolveMediaUrl(src.replace(/^\//, ""))}${suffix}`;
    }
  );
}
