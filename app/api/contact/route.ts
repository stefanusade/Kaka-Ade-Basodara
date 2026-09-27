import { NextResponse } from "next/server";
import {
  CONTACT_LIMITS,
  clientIp,
  sanitizeEmail,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/sanitize";

/**
 * Terima pesan dari form kontak, bersihkan, verifikasi Cloudflare Turnstile,
 * lalu simpan ke CMS (content type `contact-form`).
 *
 * API key CMS hanya dipakai di server (CMS_CONTACT_API_KEY) — key ini
 * read/write KHUSUS content type `contact-form`, bukan key konten lain.
 */

const CMS_BASE_URL = process.env.CMS_BASE_URL ?? "https://cms.kakaadebasodara.com/api/v1";
const CONTACT_API_KEY = process.env.CMS_CONTACT_API_KEY ?? "";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY ?? "";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

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

export async function POST(request: Request) {
  const ip = clientIp(request);

  if (isRateLimited(ip)) {
    return fail("Too many messages from this device. Please try again later.", 429);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return fail("Invalid request body.", 400);
  }

  // Honeypot: field tersembunyi yang hanya diisi bot. Dibalas sukses palsu
  // supaya bot tidak belajar, tanpa meneruskan apa pun ke CMS.
  if (sanitizeText(body.website, 20)) {
    return NextResponse.json({ success: true, message: "Thanks! Your message has been sent." });
  }

  const name = sanitizeText(body.name, CONTACT_LIMITS.name);
  const email = sanitizeEmail(body.email);
  const subject = sanitizeText(body.subject, CONTACT_LIMITS.subject);
  const message = sanitizeMultiline(body.message, CONTACT_LIMITS.message);

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

  const token = sanitizeText(body.token, 2048);
  if (!(await verifyTurnstile(token, ip))) {
    return fail("Bot verification failed. Please reload the page and try again.", 400);
  }

  if (!CONTACT_API_KEY) {
    console.error("[contact] CMS_CONTACT_API_KEY belum diisi — pesan tidak dikirim.");
    return fail("The contact form is not configured yet. Please use WhatsApp or email.", 500);
  }

  try {
    const res = await fetch(`${CMS_BASE_URL}/contact-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": CONTACT_API_KEY },
      body: JSON.stringify({ subject, email, name, message }),
      signal: AbortSignal.timeout(15000),
    });

    const payload = (await res.json().catch(() => null)) as
      | { success?: boolean; error?: { message?: string } }
      | null;

    if (!res.ok || !payload || payload.success === false) {
      // CMS bisa membalas HTTP 200 dengan body HTML (fatal error PHP), karena
      // itu body yang gagal di-parse JSON juga diperlakukan sebagai kegagalan.
      console.error(
        `[contact] CMS menolak pesan (HTTP ${res.status}, body ${
          payload ? JSON.stringify(payload).slice(0, 300) : "non-JSON"
        })`
      );
      return fail(
        "We couldn't deliver your message right now. Please use WhatsApp or email, or try again later.",
        502
      );
    }

    return NextResponse.json({ success: true, message: "Thanks! Your message has been sent." });
  } catch (error) {
    console.error("[contact] Gagal menghubungi CMS:", error);
    return fail("We couldn't reach the server. Please try again in a moment.", 502);
  }
}
