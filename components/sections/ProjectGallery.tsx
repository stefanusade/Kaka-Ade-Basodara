"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

/**
 * Carousel galeri project + lightbox.
 *
 * Carousel memakai scroll-snap native supaya geser lewat sentuhan/trackpad
 * mulus, ditambah tombol untuk mouse & keyboard. Klik gambar membuka lightbox
 * (Escape menutup, panah kiri/kanan berpindah gambar).
 */
export default function ProjectGallery({ images, title }: { images: string[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isLightboxOpen = lightboxIndex !== null;

  // Keyboard (Escape + panah) dan kunci scroll halaman selama lightbox terbuka
  useEffect(() => {
    if (!isLightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) => (current === null ? current : Math.max(0, current - 1)));
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? current : Math.min(images.length - 1, current + 1)
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen, images.length]);

  // Pindahkan fokus ke tombol tutup agar keyboard langsung bisa keluar
  useEffect(() => {
    if (isLightboxOpen) closeButtonRef.current?.focus();
  }, [isLightboxOpen]);

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;

    const clamped = Math.max(0, Math.min(next, images.length - 1));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  /** Sinkronkan indikator saat pengguna menggeser sendiri (swipe/trackpad). */
  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;

    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  const atStart = index === 0;
  const atEnd = index >= images.length - 1;

  const navButtonClass =
    "rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-slate-100 dark:bg-slate-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length} at full size`}
              className="group relative aspect-video w-full shrink-0 cursor-zoom-in snap-center overflow-hidden"
            >
              <Image
                src={src}
                alt={`${title} — image ${i + 1}`}
                fill
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
              />
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                View full size
              </span>
            </button>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={atStart}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={atEnd}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>

            <p
              aria-live="polite"
              className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white"
            >
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — image ${lightboxIndex + 1} of ${images.length}`}
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 p-4 sm:p-6"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex items-center justify-between text-white"
          >
            <p className="text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close full size view"
              className={navButtonClass}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="relative mt-4 flex-1">
            <Image
              src={images[lightboxIndex]}
              alt={`${title} — image ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {images.length > 1 && (
            <div
              onClick={(event) => event.stopPropagation()}
              className="mt-4 flex items-center justify-center gap-4"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                disabled={lightboxIndex === 0}
                aria-label="Previous image"
                className={navButtonClass}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1))
                }
                disabled={lightboxIndex === images.length - 1}
                aria-label="Next image"
                className={navButtonClass}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
