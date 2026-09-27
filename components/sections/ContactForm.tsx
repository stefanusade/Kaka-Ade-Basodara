"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ALLOWED_ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_BYTES } from "@/lib/sanitize";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const MAX_ATTACHMENT_MB = Math.round(ATTACHMENT_MAX_BYTES / (1024 * 1024));
const ACCEPT_ATTRIBUTE = ALLOWED_ATTACHMENT_EXTENSIONS.map((extension) => `.${extension}`).join(",");

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: { sitekey: string; theme?: "light" | "dark" | "auto" }
      ) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

/** Script Cloudflare dimuat sekali saja, berapa pun jumlah widget di halaman. */
let turnstileScript: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileScript) return turnstileScript;

  turnstileScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });

  return turnstileScript;
}

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

const LABEL_CLASS = "block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [fileError, setFileError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || widgetId.current || !window.turnstile || !containerRef.current) return;

        // Ikuti tema situs (kelas `dark` di <html>), bukan prefers-color-scheme OS
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme,
        });
      })
      .catch((error) => console.error("[contact] Turnstile gagal dimuat:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  function resetWidget() {
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }

  /** Cek awal di klien supaya pengguna tidak menunggu unggahan yang akan gagal. */
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFileError("");

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > ATTACHMENT_MAX_BYTES) {
      setFileError(`The attachment is too large (max ${MAX_ATTACHMENT_MB} MB).`);
      event.target.value = "";
      return;
    }

    const extension = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
      setFileError(
        `File type not allowed. Allowed types: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(", ")}.`
      );
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const token =
      widgetId.current && window.turnstile
        ? (window.turnstile.getResponse(widgetId.current) ?? "")
        : "";

    if (TURNSTILE_SITE_KEY && !token) {
      setStatus("error");
      setFeedback("Please complete the bot verification first.");
      return;
    }

    if (fileError) {
      setStatus("error");
      setFeedback(fileError);
      return;
    }

    data.set("token", token);
    setStatus("sending");
    setFeedback("");

    try {
      // multipart/form-data: browser mengisi boundary-nya sendiri
      const res = await fetch("/api/contact", { method: "POST", body: data });

      const payload = (await res.json().catch(() => null)) as
        | { success?: boolean; message?: string }
        | null;

      if (res.ok && payload?.success) {
        form.reset();
        setFileError("");
        resetWidget();
        setStatus("success");
        setFeedback(payload.message ?? "Thanks! Your message has been sent.");
        return;
      }

      resetWidget();
      setStatus("error");
      setFeedback(payload?.message ?? "Something went wrong. Please try again.");
    } catch {
      resetWidget();
      setStatus("error");
      setFeedback("Network error. Please check your connection and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={LABEL_CLASS}>
            Name <span className="text-blue-600 dark:text-blue-400">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            placeholder="Your name"
            className={`mt-2 ${FIELD_CLASS}`}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className={LABEL_CLASS}>
            Email <span className="text-blue-600 dark:text-blue-400">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@company.com"
            className={`mt-2 ${FIELD_CLASS}`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={LABEL_CLASS}>
          Subject <span className="text-blue-600 dark:text-blue-400">*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          maxLength={120}
          placeholder="What is this about?"
          className={`mt-2 ${FIELD_CLASS}`}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={LABEL_CLASS}>
          Message <span className="text-blue-600 dark:text-blue-400">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder="Tell us about your project…"
          className={`mt-2 resize-y ${FIELD_CLASS}`}
        />
      </div>

      {/* Honeypot — hanya bot yang mengisi field ini (disembunyikan dari pengguna) */}
      <div aria-hidden className="hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="contact-attachment" className={LABEL_CLASS}>
          Attachment <span className="text-slate-400 dark:text-slate-500">(optional)</span>
        </label>
        <input
          id="contact-attachment"
          name="attachment"
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleFileChange}
          className="mt-2 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Max {MAX_ATTACHMENT_MB} MB · {ALLOWED_ATTACHMENT_EXTENSIONS.join(", ")}
        </p>
        {fileError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
            {fileError}
          </p>
        )}
      </div>

      {TURNSTILE_SITE_KEY && <div ref={containerRef} />}

      {feedback && (
        <p
          role={status === "success" ? "status" : "alert"}
          className={`text-sm ${
            status === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {feedback}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "sending"} className="w-full sm:w-auto">
        {status === "sending" ? "Sending…" : "Send message"}
      </Button>

      {!TURNSTILE_SITE_KEY && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This form is protected by Cloudflare Turnstile once configured.
        </p>
      )}
    </form>
  );
}
