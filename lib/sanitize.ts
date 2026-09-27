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

/**
 * Batas ukuran lampiran: 4 MB. Sengaja di bawah batas body 4,5 MB milik
 * Vercel/Dewan platform lain — naikkan bila server self-hosted.
 */
export const ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

type Signature = { offset: number; bytes: number[] };

type AllowedAttachment = {
  mime: string;
  signatures: Signature[];
};

/**
 * Lampiran yang diizinkan, divalidasi dari ekstensi DAN magic bytes-nya
 * (Content-Type dari browser tidak pernah dipercaya). Tambahkan entri di sini
 * bila perlu mendukung format lain.
 */
const ALLOWED_ATTACHMENTS: Record<string, AllowedAttachment> = {
  pdf: { mime: "application/pdf", signatures: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }] },
  jpg: { mime: "image/jpeg", signatures: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  jpeg: { mime: "image/jpeg", signatures: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  png: {
    mime: "image/png",
    signatures: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  },
  webp: {
    mime: "image/webp",
    signatures: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
    ],
  },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    signatures: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }], // ZIP container
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    signatures: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }],
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    signatures: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }],
  },
};

export const ALLOWED_ATTACHMENT_EXTENSIONS = Object.keys(ALLOWED_ATTACHMENTS);

/** Nama file aman: buang direktori, sisakan karakter wajar, pakai ekstensi kanonik. */
export function sanitizeFilename(name: string, canonicalExtension: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const stem = base
    .replace(/\.[^.]*$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${stem || "attachment"}.${canonicalExtension}`;
}

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

export type AttachmentCheck =
  | { ok: true; filename: string; mime: string }
  | { ok: false; message: string };

/**
 * Validasi lampiran: ukuran, ekstensi allowlist, dan magic bytes.
 * Mengembalikan nama file + MIME kanonik yang aman dikirim ke CMS.
 */
export function validateAttachment(file: {
  name: string;
  size: number;
  bytes: Uint8Array;
}): AttachmentCheck {
  if (file.size === 0) {
    return { ok: false, message: "The attached file is empty." };
  }

  if (file.size > ATTACHMENT_MAX_BYTES) {
    const maxMb = Math.round(ATTACHMENT_MAX_BYTES / (1024 * 1024));
    return { ok: false, message: `The attachment is too large (max ${maxMb} MB).` };
  }

  const extension = (file.name.split(".").pop() ?? "").toLowerCase();
  const allowed = ALLOWED_ATTACHMENTS[extension];

  if (!allowed) {
    return {
      ok: false,
      message: `File type not allowed. Allowed types: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(", ")}.`,
    };
  }

  const matches = allowed.signatures.every((signature) =>
    signature.bytes.every((byte, index) => file.bytes[signature.offset + index] === byte)
  );

  if (!matches) {
    // Isi file tidak sesuai ekstensinya (mis. .jpg yang isinya skrip)
    return { ok: false, message: "The attached file does not match its extension." };
  }

  return { ok: true, filename: sanitizeFilename(file.name, extension), mime: allowed.mime };
}
