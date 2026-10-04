# Design

## Overview

Argonaut is precise, quick and competitive: elite training equipment for the USMLE. Clean AMBOSS-like clarity in the product, re-voiced in a saturated deep cobalt with crisp hairlines, tight radii and scoreboard-grade numerals. Gold appears only where something is genuinely ultra-high-yield (Nuggets) or earned (ranks). Marketing pages drench sections in deep ink-blue and move with long, decelerating Apple-style scroll choreography; the app itself stays still and fast.

Signature motif: **Argo Navis**, the ship constellation. Concepts are stars, mastery is brightness. It is the logo mark, the hero graphic and ARGO's knowledge map.

## Colors

Strategy: Restrained in the product (tinted neutrals + cobalt for action/selection + semantic states). Committed on marketing (deep ink-blue carries whole sections). All values OKLCH; neutrals tinted toward hue 265. Contrast verified: every text pair is AA or better in both themes.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | oklch(0.985 0.004 265) | oklch(0.2 0.035 266) | Page background |
| `--surface` | oklch(0.997 0.002 265) | oklch(0.235 0.038 266) | Content surfaces, question canvas |
| `--panel` | oklch(0.966 0.008 265) | oklch(0.215 0.036 266) | Sidebar, toolbars, secondary layer |
| `--border` | oklch(0.905 0.014 265) | oklch(0.33 0.04 266) | Hairlines |
| `--text` | oklch(0.225 0.035 265) | oklch(0.94 0.012 265) | Primary text |
| `--muted` | oklch(0.47 0.03 265) | oklch(0.74 0.025 265) | Secondary text |
| `--faint` | oklch(0.56 0.022 265) | oklch(0.64 0.028 265) | Tertiary labels, placeholders |
| `--brand` | oklch(0.45 0.19 264) | oklch(0.7 0.15 262) | Primary action, links, selection |
| `--brand-strong` | oklch(0.37 0.165 265) | oklch(0.78 0.12 262) | Pressed/hover, text on brand-soft |
| `--brand-soft` | oklch(0.95 0.028 264) | oklch(0.27 0.07 264) | Selected rows, focus tints |
| `--ink` | oklch(0.235 0.085 266) | oklch(0.12 0.04 266) | Drenched marketing sections, test-player header |
| `--gold` | oklch(0.8 0.155 80) | oklch(0.82 0.15 82) | Nugget mark, rank medals (fills, not text) |
| `--gold-ink` | oklch(0.5 0.105 68) | oklch(0.85 0.13 85) | Nugget text |
| `--gold-soft` | oklch(0.965 0.045 92) | oklch(0.28 0.06 80) | Nugget callout background |
| `--correct` / `--correct-soft` | oklch(0.5 0.13 152) / oklch(0.962 0.035 152) | oklch(0.74 0.15 152) / oklch(0.26 0.05 152) | Correct answers (always with a check icon) |
| `--incorrect` / `--incorrect-soft` | oklch(0.55 0.19 27) / oklch(0.962 0.025 25) | oklch(0.7 0.17 25) / oklch(0.27 0.06 25) | Incorrect answers (always with a cross icon) |

Never `#000` or `#fff`. Gold is never decorative.

## Typography

- **Archivo** (variable: weight 100 to 900, width 62 to 125) carries everything in the product. UI at width 100; display headlines at width 112 to 125 and weight 750 to 850 for scoreboard energy. Tabular numerals (`font-variant-numeric: tabular-nums`) for timers, scores, percentiles, ranks.
- **Source Serif 4** (optical sizes) only for Library prose, so study mode reads like a textbook and test mode reads like the exam.
- Product scale (rem, fixed): 12 / 13 / 14 / 15 (base UI) / 17 (vignette) / 20 / 24 / 30. Marketing display uses `clamp()` from 40px to 112px with tight tracking (-0.03em).
- Vignette text: 17px, line-height 1.65, max 72ch. Library prose: 18px serif, line-height 1.7, max 68ch.
- Labels in caps only for short eyebrow metadata (letter-spacing 0.08em, 11 to 12px).

## Elevation & Shape

- Radii: 6px controls, 10px panels, 14px marketing tiles, full pills only for status chips.
- Depth by hairline borders and tone shifts, not shadows. One shadow token for floating layers (popovers, toasts): `0 1px 2px oklch(0.2 0.04 265 / 0.06), 0 8px 24px oklch(0.2 0.04 265 / 0.08)`.
- No glassmorphism, no gradient text, no colored side-stripe borders.

## Components

- **Buttons**: primary (brand fill, bg-colored label), secondary (surface + border), ghost, danger. Height 36 (app) / 44 (marketing). All states: hover, focus-visible ring (2px brand + 2px offset), active, disabled, loading.
- **Answer option**: full-width row, letter in a 28px rounded-square chip, text 16px. States: default, hover, selected (brand-soft + brand chip), struck (line-through, 45% opacity), correct (correct-soft + check), incorrect selected (incorrect-soft + cross), peer percentage bar after review.
- **Nugget badge**: small gold diamond glyph + "Nugget" in gold-ink on gold-soft; callout block in explanations uses a full gold-soft tint with a gold glyph, never a side stripe.
- **Data**: tables with 44px rows, right-aligned tabular numbers, sticky headers. Charts follow the dataviz skill palette; correct/incorrect series also differ in pattern or label.
- **Navigation**: app shell with a 248px left sidebar on panel tone, collapsible to icons; test player is full-screen with an ink header bar (exam-like), question navigator rail, and bottom action bar.

## Layout

- 4px spacing base. App content max width 1240px; reading surfaces 72ch.
- Marketing: long scroll, one idea per viewport, left-aligned asymmetric compositions, drenched ink sections alternate with light sections.

## Motion

- Product: 150 to 220ms, `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quart). Motion only for state: selection, reveal of explanation, route transitions, toasts.
- Marketing: Lenis smooth scroll, scroll-linked reveals 600 to 900ms with `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo), sticky scrollytelling for the ARGO section, constellation lines drawing with stroke-dashoffset.
- No bounce, no elastic, no confetti. `prefers-reduced-motion`: all spatial motion becomes a 150ms opacity fade; smooth scroll disabled.
