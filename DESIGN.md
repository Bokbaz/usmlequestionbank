# Design

## Overview

Argonaut is a question bank that runs like a Formula 1 team: precise, fast, measured to the millimetre. The look borrows from race engineering rather than racing costume: timing screens, telemetry traces, pit-wall readouts and tick-marked rulers, set in a wide, forward-leaning gothic. One signal orange carries the brand; carbon (near-black ink) and cool aluminium greys do everything else. Marketing pages drench whole sections in orange or carbon and move with long, decelerating scroll; the app itself stays still and fast.

Signature components: the **timing tower** (a ranked, live-updating table of a student's systems with a "team radio" line from ARGO) and the **telemetry trace** (stacked channels sharing one x-axis, with ARGO sessions marked as pit stops). The Argo Navis "A" mark stays as the logo, its apex star in signal orange.

## Colors

Strategy: Committed on marketing (signal orange and carbon each own whole sections). Restrained in the product (aluminium neutrals, carbon for emphasis, orange for action and selection, semantic states). All values OKLCH. Contrast verified numerically: every text pair is AA or better in both themes.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | oklch(0.972 0.004 250) | oklch(0.19 0.012 262) | Page background |
| `--surface` | oklch(0.994 0.002 250) | oklch(0.225 0.014 262) | Content surfaces, question canvas |
| `--panel` | oklch(0.952 0.005 250) | oklch(0.205 0.013 262) | Sidebar, toolbars, secondary layer |
| `--border` | oklch(0.885 0.007 250) | oklch(0.31 0.015 262) | Hairlines |
| `--text` | oklch(0.19 0.02 262) | oklch(0.95 0.004 250) | Primary text |
| `--muted` | oklch(0.45 0.016 258) | oklch(0.76 0.01 255) | Secondary text |
| `--faint` | oklch(0.54 0.014 258) | oklch(0.66 0.012 255) | Tertiary labels, placeholders |
| `--brand` | oklch(0.68 0.19 45) | oklch(0.72 0.18 48) | Signal orange. A **fill** only: buttons, selection chips, markers. Always carries ink text (`--on-brand`). |
| `--brand-hover` | oklch(0.64 0.185 43) | oklch(0.77 0.145 52) | Hover/pressed fill |
| `--brand-strong` | oklch(0.52 0.15 40) | oklch(0.8 0.125 55) | Orange for **text and icons** (links, eyebrows), focus rings |
| `--brand-soft` | oklch(0.955 0.024 55) | oklch(0.3 0.06 45) | Selected rows, tints |
| `--on-brand` / `--on-brand-muted` | oklch(0.18 0.02 262) / oklch(0.28 0.05 40) | same | Text on orange (never use `--muted` on orange) |
| `--ink` / `--ink-2` | oklch(0.18 0.02 262) / oklch(0.235 0.022 262) | oklch(0.14 0.012 262) / oklch(0.205 0.015 262) | Carbon: drenched sections, test-player header, active nav |
| `--gold` / `--gold-ink` / `--gold-soft` | oklch(0.82 0.16 86) / oklch(0.5 0.105 72) / oklch(0.965 0.045 95) | oklch(0.83 0.15 86) / oklch(0.86 0.13 88) / oklch(0.3 0.06 82) | Nuggets, marked flags, rank 1. Never decorative. |
| `--correct` / `--correct-soft` | oklch(0.5 0.13 152) / oklch(0.962 0.035 152) | oklch(0.74 0.15 152) / oklch(0.28 0.05 152) | Correct answers (always with a check icon) |
| `--incorrect` / `--incorrect-soft` | oklch(0.53 0.19 22) / oklch(0.96 0.018 18) | oklch(0.7 0.17 22) / oklch(0.29 0.06 20) | Incorrect answers (always with a cross icon). Hue 22 keeps it clear of the orange at 45. |

Never `#000` or `#fff`. Data-viz palettes (`--viz-*`, `--seq-*`, `--div-*`, `--series-*`) are unchanged and validated separately; blue data series against the orange brand is deliberate.

## Typography

- **Science Gothic** (variable: weight 100 to 900, width 50 to 200, slant 0 to -10) for display and labels. Classes (in the `components` layer, so per-element utilities override them): `.display` (width 140%, line-height 0.94, weights 850 to 900) for marketing headlines; `.slant` adds an 8° forward lean, reserved for the loudest lines (hero, closing call, auth aside); `.heading` (width 118%) for product page titles; `.eyebrow` (11.5px caps, width 112%, tracking 0.08em) for timing-screen labels. Its squared zero is part of the voice.
- **Atkinson Hyperlegible Next** (weight 200 to 800) for all body and UI text, chosen for legibility in long vignettes and for non-native readers; its slashed zero keeps lab values unambiguous. Tabular numerals (`.tabular`) for timers, scores and ranks; both families support them.
- **Source Serif 4** only for Library prose.
- Marketing display sizes use `clamp()`; measure the text before setting a ceiling (ARGONAUT at width 150% is ~10.1× its font size wide). Product scale stays fixed.
- Vignette text: 17px, line-height 1.65, max 72ch. Library prose: 18px serif, line-height 1.7, max 68ch.

## Elevation & Shape

- Radii: 4px controls, 6px panels, 8px marketing tiles and demos; full pills only for status chips.
- Depth by hairlines and tone shifts. Heavier 2px rules (`border-text` or `border-on-brand`) open key sections, like a timing-sheet header.
- Precision motifs: a tick-mark ruler along the edge of orange sections; faint 12-column hairlines behind the hero.
- No glassmorphism, no gradient text, no coloured side-stripe borders.

## Components

- **Buttons**: `primary` (orange fill, ink label), `secondary` (surface + border), `ghost`, `danger`; `ink` is the orange CTA on carbon; `carbon` and `carbon-outline` are for orange surfaces. Bold labels.
- **Answer option**: selected = orange chip with ink letter on `--brand-soft`; correct/incorrect use their semantic tints with icons.
- **Navigation**: active sidebar item is a carbon block with an orange icon. Segmented controls invert the selected option (`bg-text text-bg`). The sidebar uses the compact logo (`<Logo size="sm" />`).
- **Timing tower** (marketing): carbon panel, position / system / accuracy / trend columns, focus row in solid orange, rows reorder with layout animation, ARGO "team radio" line below.
- **Telemetry** (marketing): stacked channels sharing one x-axis, orange primary channel with a soft fill, dashed orange pit-stop lines for ARGO sessions.
- **Nugget badge**: gold diamond + "Nugget" on gold-soft.

## Layout

- 4px spacing base. Marketing container 1320px; app content 1240px; reading surfaces 72ch.
- Marketing order: orange hero (timing tower overlapping into the next section) → specs + season objectives → carbon ARGO telemetry → questions → Nuggets + Library split → carbon Daily Challenge → pricing → FAQ → orange closing call → carbon footer with a full-width wordmark.

## Motion

- Product: 150 to 220ms, ease-out-quart. Motion only for state.
- Marketing: Lenis smooth scroll; reveals of 800ms with ease-out-expo (opacity + translate, no blur); timing-tower rows reorder every ~3.4s; telemetry traces draw on scroll.
- Markup must not branch on `useReducedMotion()` (it is null on the server); handle reduced motion through `motion-safe:` classes and zero-duration transitions.
- No bounce, no elastic, no confetti.
