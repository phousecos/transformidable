// @ts-nocheck
import { Constellation } from "./Constellation";

/**
 * Sky — the signature hero backdrop: a dusk/night *ombré* with the
 * constellation layered over it like stars.
 *
 * Each main page gets its own `variant` — a distinct ombré palette plus a
 * distinct star field (unique seed + a signature "anchor" star) — so sections
 * feel individual but belong to one family. The sky is intentionally
 * always-dark (its colors are fixed in research.css, not theme tokens), which
 * is why hero copy laid over it should use the `.tr-onsky` treatment.
 *
 * Usage: drop <Sky variant="research" /> as the first child of a `.hero` (or
 * `.idx-hero`) exactly where <Constellation /> went; hero content sits above it
 * via z-index.
 */

// Distinct star fields — one per main page. Each varies by *region*
// (spread), density (count), seed, and the position of its signature anchor
// star, so no two read as the same constellation. `variant` also selects the
// ombré via a CSS class (.tr-sky--<variant>) defined in research.css.
// Each field lives in a distinct region (right of the copy), with its own
// density, seed, and anchor-star position — so no two read alike.
export const SKY_VARIANTS = {
  // Home — broad right field, full height, dense.
  research:     { seed: 7,  count: 34, region: { x0: 0.38, x1: 1, y0: 0,    y1: 1    }, focal: { x: 74, y: 30 } },
  // Publications (also Governance Files / podcast cover) — right, upper band.
  publications: { seed: 13, count: 28, region: { x0: 0.46, x1: 1, y0: 0,    y1: 0.66 }, focal: { x: 66, y: 22 } },
  // Case Files — far right, full height, dense.
  "case-files": { seed: 41, count: 34, region: { x0: 0.56, x1: 1, y0: 0,    y1: 1    }, focal: { x: 88, y: 34 } },
  // Research Notes — right, lower band, sparse.
  notes:        { seed: 23, count: 22, region: { x0: 0.42, x1: 1, y0: 0.34, y1: 1    }, focal: { x: 60, y: 78 } },
  // About — far right corner, upper, airy.
  about:        { seed: 67, count: 16, region: { x0: 0.6,  x1: 1, y0: 0,    y1: 0.58 }, focal: { x: 86, y: 20 } },
  // Podcast — right, full, medium.
  podcast:      { seed: 29, count: 30, region: { x0: 0.44, x1: 1, y0: 0,    y1: 1    }, focal: { x: 58, y: 26 } },
  // Events — right, lower-mid, sparse-wide.
  events:       { seed: 53, count: 20, region: { x0: 0.4,  x1: 1, y0: 0.28, y1: 1    }, focal: { x: 72, y: 62 } },
  // Tools — far right, upper-full, dense.
  tools:        { seed: 83, count: 30, region: { x0: 0.54, x1: 1, y0: 0,    y1: 0.82 }, focal: { x: 78, y: 40 } },
  // Home (parent site) — broad right field, airy.
  home:         { seed: 3,  count: 30, region: { x0: 0.5,  x1: 1, y0: 0,    y1: 1    }, focal: { x: 80, y: 36 } },
  // Advisory — right, mid band, medium.
  advisory:     { seed: 97, count: 24, region: { x0: 0.5,  x1: 1, y0: 0.12, y1: 0.9  }, focal: { x: 76, y: 48 } },
  // Publishing — right, upper band, sparse.
  publishing:   { seed: 59, count: 20, region: { x0: 0.52, x1: 1, y0: 0,    y1: 0.7  }, focal: { x: 70, y: 24 } },
  // Media — far right, full, medium.
  media:        { seed: 71, count: 28, region: { x0: 0.5,  x1: 1, y0: 0,    y1: 1    }, focal: { x: 84, y: 58 } },
  // Academy — drawn into the right half of the hero (academy.css), full height.
  academy:      { seed: 101, count: 42, region: { x0: 0.08, x1: 1, y0: 0,   y1: 1    }, focal: { x: 62, y: 42 } },
  default:      { seed: 7,  count: 34, region: { x0: 0.38, x1: 1, y0: 0,    y1: 1    }, focal: { x: 74, y: 30 } },
};

export function Sky({ variant = "research", className = "" }) {
  const cfg = SKY_VARIANTS[variant] || SKY_VARIANTS.default;
  return (
    <div className={`tr-sky tr-sky--${variant} ${className}`} aria-hidden="true">
      <span className="tr-sky-glow" />
      <Constellation seed={cfg.seed} count={cfg.count} region={cfg.region} focal={cfg.focal} className="tr-sky-stars" />
    </div>
  );
}
