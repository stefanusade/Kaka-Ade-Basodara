"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export default function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Subscription failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
      />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </Button>
      {status === "success" && (
        <p role="status" className="text-sm text-green-400 sm:hidden">
          Subscribed! Check your inbox.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-red-400 sm:hidden">
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}
