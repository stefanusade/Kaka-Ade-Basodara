import Image from "next/image";
import { SITE } from "@/lib/constants";

/** Wordmark situs — PNG transparan dengan marka abu, aman di latar gelap. */
const LOGO_SRC = "/KAB Mono.png";
const LOGO_ASPECT = 1629 / 971;

/**
 * Logo situs (wordmark "kab"). Dipakai di header dan footer dengan tinggi
 * berbeda; lebarnya dihitung otomatis dari rasio asli file.
 */
export default function Logo({
  height = 32,
  priority = false,
  className,
}: {
  /** Tinggi render dalam piksel. */
  height?: number;
  /** Set true untuk logo di atas lipatan (header) agar tidak lazy-load. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt={SITE.name}
      width={Math.round(height * LOGO_ASPECT)}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
