# Aikah — Search and Prosper

A cinematic, fully responsive landing page for the science-fiction concept brand
**Aikah**: a self-sufficient cosmic material grown at Eridani 69T, powered by
zero-point energy, with no seams and no batteries.

Built as a single static page. No framework, and no build step required to view it.

---

## Quick start

The page is fully static. Open `index.html` directly, or serve it:

```bash
node serve.mjs          # http://localhost:12000
```

### Working on the CSS

Tailwind is compiled to `assets/css/aikah.css`, which is committed so the page
works with zero tooling. If you change `src/input.css` or any markup, rebuild:

```bash
npm install
npm run build:css       # one-off, minified
npm run dev             # watch CSS + serve on :12000
```

---

## Files

```
index.html              the whole page — all 8 sections
serve.mjs               zero-dependency static server (with traversal guard)
src/input.css           Tailwind entry + the full design system
tailwind.config.js      design tokens (colors, fonts, easings)
assets/css/aikah.css    compiled stylesheet (committed)
assets/js/aikah.js      interaction layer, no dependencies
```

---

## Sections

| # | Section | Notes |
|---|---------|-------|
| — | Header | Fixed, condenses on scroll, hides when scrolling down |
| 1 | Hero | Canvas starfield, CSS planet with orbits, split-word headline, scroll indicator |
| — | Marquee | Infinite ticker of material properties |
| 2 | Manifesto | Founder card, planetary origin, philosophy, three principles |
| 3 | Lifecycle | Four process cards: Origin → Transformation → Energy → Recycling |
| 4 | Projects | Gradient Chair, Glow Causeway, Breath Column, Slow Pod |
| 5 | Deliveries | Eight-entry ledger spanning 12,400 years |
| 6 | Recognition | "Mother Cargo" intergalactic prize spotlight |
| 7 | Footer | Shipping visual, closing philosophy, contact CTA + GitHub |

---

## Design system

Tokens live in `src/input.css` and are surfaced through Tailwind.

| Token | Value | Use |
|-------|-------|-----|
| `--obsidian` | `#0a0a0a` | Page background |
| `--void` | `#050505` | Deepest black, overlays |
| `--graphite` | `#111111` | Card surfaces |
| `--line` | `#27272a` | Borders |
| `--ink` | `#fafafa` | Primary text |
| `--muted` | `#a1a1aa` | Secondary text (`text-mist`) |
| `--accent` | `#8fe3ff` | Zero-point cyan, used sparingly |

Type: **Space Grotesk** for display, **Inter** for body, **JetBrains Mono** for
labels. Display sizes are bounded by viewport height as well as width, so short
landscape screens stay composed.

---

## Motion

Everything animates from a single easing pair (`--ease-cinematic`,
`--ease-soft`) and is opt-out via `prefers-reduced-motion`:

- **Lenis** smooth scrolling, loaded from a CDN and feature-detected. If it is
  blocked or fails, the page falls back to native scrolling.
- **Split-word reveals** — headings are split at runtime into per-word masks
  with a staggered delay, preserving an `aria-label` with the original text.
- **IntersectionObserver reveals** for fade, scale, and clip transitions.
- **Canvas starfield** that twinkles and drifts on scroll, pausing when offscreen.
- **Scroll parallax** and **pointer parallax** on the hero planet, both applied
  via the CSS `translate` property so they compose with layout transforms.
- **Custom cursor** with contextual labels, disabled on touch devices.
- **Preloader** with a hard timeout, so a stalled asset can never trap a visitor.

---

## Accessibility

Verified with automated audits during development:

- **Contrast** — all 191 text nodes pass WCAG AA (lowest ratio 5.86:1).
- **Keyboard** — visible focus ring on every interactive element, plus a skip link.
- **Reduced motion** — all reveals resolve to their final state, no animation.
- **Semantics** — one `h1`, ordered headings, labelled landmarks, `alt` on every
  content image, decorative layers marked `aria-hidden`.
- **Resilience** — the page renders correctly with images, fonts, or the Lenis
  CDN blocked.

---

## Imagery

Placeholder photography is hot-linked from Unsplash with `auto=format` sizing,
chosen for a dark cosmic palette. Swap the `src` values in `index.html` for
final assets. Every URL was verified to return HTTP 200.

---

## Deploying

Any static host works — the page is plain HTML, CSS, and JS. Point the host at
the repository root. `serve.mjs` is only for local preview.
