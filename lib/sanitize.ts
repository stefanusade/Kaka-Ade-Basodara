/**
 * Sanitasi input untuk endpoint publik (form kontak).
 *
 * Semua nilai dari klien dianggap tidak tepercaya: karakter kontrol dibuang,
 * panjang dibatasi, dan whitespace dirapikan — sekaligus mencegah CRLF/header
 * injection bila nilainya kelak dipakai di header atau email.
 */

export const CONTACT_LIMITS = {
  subject: 120,
  name: 80,
  email: 254,
  message: 4000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Buang karakter kontrol yang tidak pernah valid pada teks form. */
function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/** Teks satu baris: normalisasi Unicode, rapikan spasi, batasi panjang. */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return stripControlChars(value.normalize("NFC"))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Teks multi-baris: baris baru dipertahankan, maksimal satu baris kosong. */
export function sanitizeMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return stripControlChars(value.normalize("NFC").replace(/\r\n?/g, "\n"))
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

/** Email: dinormalisasi ke huruf kecil lalu divalidasi. "" bila tidak valid. */
export function sanitizeEmail(value: unknown): string {
  const email = sanitizeText(value, CONTACT_LIMITS.email).toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : "";
}

/** Ambil IP klien dari header proxy (dipakai untuk rate limit & siteverify). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}
