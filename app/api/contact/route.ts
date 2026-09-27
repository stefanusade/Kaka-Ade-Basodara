import { NextResponse } from "next/server";
import {
  CONTACT_LIMITS,
  clientIp,
  sanitizeEmail,
  sanitizeMultiline,
  sanitizeText,
  validateAttachment,
} from "@/lib/sanitize";

/**
 * Terima pesan dari form kontak, bersihkan, verifikasi Cloudflare Turnstile,
 * unggah lampiran (opsional) ke CMS, lalu simpan entri ke content type
 * `contact-form`.
 *
 * API key CMS (CMS_CONTACT_API_KEY) hanya dipakai di server. Key ini
 * read/write KHUSUS `contact-form` + endpoint media — key konten lain tidak
 * punya scope untuk media.
 */

const CMS_BASE_URL = process.env.CMS_BASE_URL ?? "https://cms.kakaadebasodara.com/api/v1";
const CONTACT_API_KEY = process.env.CMS_CONTACT_API_KEY ?? "";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY ?? "";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const SUCCESS_MESSAGE = "Thanks! Your message has been sent.";

/** Rate limit per IP, per instance (cukup untuk meredam spam dasar). */
const recentRequests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (recentRequests.get(ip) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    recentRequests.set(ip, recent);
    return true;
  }

  recent.push(now);
  recentRequests.set(ip, recent);
  return false;
}

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    console.warn("[contact] TURNSTILE_SECRET_KEY belum diisi — verifikasi bot dilewati.");
    return true;
  }
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return Boolean(data?.success);
  } catch (error) {
    console.error("[contact] Gagal memverifikasi Turnstile:", error);
    return false;
  }
}

/** Terima multipart/form-data (form + lampiran) maupun JSON (tanpa lampiran). */
async function readPayload(
  request: Request
): Promise<{ fields: Record<string, unknown>; attachment: File | null } | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;

    const file = form.get("attachment");
    return {
      fields: Object.fromEntries(
        [...form.entries()].filter(([, value]) => typeof value === "string")
      ),
      attachment: file instanceof File && file.size > 0 ? file : null,
    };
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  return body ? { fields: body, attachment: null } : null;
}

/** Unggah lampiran ke CMS, kembalikan `path` untuk field `attachment`. */
async function uploadAttachment(file: File): Promise<{ path: string } | { error: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = validateAttachment({ name: file.name, size: file.size, bytes });

  if (!checked.ok) return { error: checked.message };

  const form = new FormData();
  // Content-Type tidak di-set manual — runtime mengisi boundary-nya sendiri
  form.append("file", new Blob([bytes], { type: checked.mime }), checked.filename);

  try {
    const res = await fetch(`${CMS_BASE_URL}/media`, {
      method: "POST",
      headers: { "X-API-Key": CONTACT_API_KEY },
      body: form,
      signal: AbortSignal.timeout(30000),
    });

    const payload = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: { path?: string } }
      | null;

    const path = payload?.data?.path;
    if (!res.ok || !payload?.success || !path) {
      console.error(
        `[contact] Unggah lampiran ditolak CMS (HTTP ${res.status}):`,
        JSON.stringify(payload).slice(0, 300)
      );
      return { error: "We couldn't upload your attachment. Please try again." };
    }

    return { path };
  } catch (error) {
    console.error("[contact] Gagal mengunggah lampiran:", error);
    return { error: "We couldn't upload your attachment. Please try again." };
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  if (isRateLimited(ip)) {
    return fail("Too many messages from this device. Please try again later.", 429);
  }

  const payload = await readPayload(request);
  if (!payload) {
    return fail("Invalid request body.", 400);
  }

  const { fields, attachment } = payload;

  // Honeypot: field tersembunyi yang hanya diisi bot. Dibalas sukses palsu
  // supaya bot tidak belajar, tanpa meneruskan apa pun ke CMS.
  if (sanitizeText(fields.website, 20)) {
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  }

  const name = sanitizeText(fields.name, CONTACT_LIMITS.name);
  const email = sanitizeEmail(fields.email);
  const subject = sanitizeText(fields.subject, CONTACT_LIMITS.subject);
  const message = sanitizeMultiline(fields.message, CONTACT_LIMITS.message);

  const missing = [
    !name && "name",
    !email && "email",
    !subject && "subject",
    !message && "message",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Please check the highlighted fields and try again.",
        fields: missing,
      },
      { status: 422 }
    );
  }

  const token = sanitizeText(fields.token, 2048);
  if (!(await verifyTurnstile(token, ip))) {
    return fail("Bot verification failed. Please reload the page and try again.", 400);
  }

  if (!CONTACT_API_KEY) {
    console.error("[contact] CMS_CONTACT_API_KEY belum diisi — pesan tidak dikirim.");
    return fail("The contact form is not configured yet. Please use WhatsApp or email.", 500);
  }

  // Lampiran (opsional) divalidasi & diunggah lebih dulu; entri hanya dibuat
  // kalau unggahan berhasil supaya tidak ada pesan tanpa lampiran.
  const entry: Record<string, string> = { subject, email, name, message };

  if (attachment) {
    const uploaded = await uploadAttachment(attachment);
    if ("error" in uploaded) return fail(uploaded.error, 400);

    entry.attachment = uploaded.path;
  }

  try {
    const res = await fetch(`${CMS_BASE_URL}/contact-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": CONTACT_API_KEY },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(15000),
    });

    const result = (await res.json().catch(() => null)) as
      | { success?: boolean; error?: { message?: string } }
      | null;

    if (!res.ok || !result || result.success === false) {
      // CMS bisa membalas HTTP 200 dengan body HTML (fatal error PHP), karena
      // itu body yang gagal di-parse JSON juga diperlakukan sebagai kegagalan.
      console.error(
        `[contact] CMS menolak pesan (HTTP ${res.status}, body ${
          result ? JSON.stringify(result).slice(0, 300) : "non-JSON"
        })`
      );
      return fail(
        "We couldn't deliver your message right now. Please use WhatsApp or email, or try again later.",
        502
      );
    }

    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("[contact] Gagal menghubungi CMS:", error);
    return fail("We couldn't reach the server. Please try again in a moment.", 502);
  }
}
