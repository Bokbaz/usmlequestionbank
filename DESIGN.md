# Design

## Overview

Argonaut is a question bank that runs like a Formula 1 team: precise, fast, measured to the millimetre. The look borrows from race engineering rather than racing costume: timing screens, telemetry traces, pit-wall readouts and tick-marked rulers, set in a sharp, Apple-like grotesque. One deep teal carries the brand; carbon (near-black ink, tinted teal) and cool aluminium greys do everything else, and a bright telemetry aqua lights up data on dark and teal surfaces. Marketing pages drench whole sections in teal or carbon and move with long, decelerating scroll; the app stays still and fast, except for the moment you get a question right.

Signature components: the **answer trace** (one answer logged across ARGO's 16 channels, cell by cell, then ARGO's verdict), the **timing tower** (a ranked, live-updating table of a student's systems with a "team radio" line from ARGO) and the **telemetry trace** (stacked channels sharing one x-axis, ARGO sessions marked as pit stops). The Argo Navis "A" (`Branding/argonaut_icon.svg`) stays as the logo; its four-point apex star is teal on light surfaces and aqua on dark ones.

## Colors

Strategy: Committed on marketing (teal and carbon each own whole sections). Restrained in the product (aluminium neutrals, carbon for emphasis, teal for action and selection, semantic states). All values OKLCH. Contrast verified numerically: every text pair is AA or better in both themes.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | oklch(0.975 0.004 215) | oklch(0.175 0.013 215) | Page background |
| `--surface` | oklch(0.995 0.002 215) | oklch(0.21 0.015 215) | Content surfaces, question canvas |
| `--panel` | oklch(0.955 0.006 215) | oklch(0.19 0.014 215) | Sidebar, toolbars, secondary layer |
| `--border` | oklch(0.89 0.008 215) | oklch(0.3 0.016 215) | Hairlines |
| `--text` | oklch(0.2 0.022 220) | oklch(0.95 0.004 215) | Primary text |
| `--muted` | oklch(0.45 0.018 220) | oklch(0.77 0.012 215) | Secondary text |
| `--faint` | oklch(0.54 0.016 220) | oklch(0.66 0.013 215) | Tertiary labels, placeholders |
| `--brand` | oklch(0.43 0.074 202) | oklch(0.45 0.076 202) | Deep teal (close to AMBOSS #015a64, slightly greener). A **fill** with light text (`--on-brand`, 7.6:1 / 7.0:1): buttons, hero drench, selection |
| `--brand-hover` | oklch(0.38 0.068 202) | oklch(0.43 0.074 202) | Hover/pressed fill |
| `--brand-strong` | = `--brand` | oklch(0.8 0.11 192) | Teal for **text and icons** on light/dark surfaces (links, eyebrows), focus rings |
| `--brand-soft` | oklch(0.955 0.024 200) | oklch(0.29 0.05 200) | Selected rows, tints |
| `--on-brand` / `--on-brand-muted` | oklch(0.985 0.005 200) / oklch(0.86 0.04 200) | oklch(0.99 0.004 200) / oklch(0.88 0.035 200) | Text on teal |
| `--signal` | oklch(0.87 0.13 180) | same | Telemetry aqua. **Only on teal and carbon** (traces, live dots, key numbers, the `ink` button). Never on light surfaces (1.4:1). |
| `--ink` / `--ink-2` | oklch(0.2 0.025 215) / oklch(0.25 0.028 215) | oklch(0.135 0.014 215) / oklch(0.19 0.017 215) | Carbon: drenched sections, test-player header, active nav |
| `--gold` / `--gold-ink` / `--gold-soft` | unchanged | unchanged | Nuggets, marked flags, rank 1. Never decorative. On teal, flags use oklch(0.9 0.13 90) for contrast. |
| `--correct` / `--correct-soft` | oklch(0.5 0.13 150) / oklch(0.962 0.035 150) | oklch(0.74 0.15 150) / oklch(0.28 0.05 150) | Correct answers (always with a check icon). Hue 150 stays clear of the teal at 202. |
| `--incorrect` / `--incorrect-soft` | oklch(0.53 0.19 22) / oklch(0.96 0.018 18) | oklch(0.7 0.17 22) / oklch(0.29 0.06 20) | Incorrect answers (always with a cross icon) |

Never `#000` or `#fff`. Data-viz palettes (`--viz-*`, `--seq-*`, `--div-*`, `--series-*`) are unchanged and validated separately.

## Typography

- **Geist** (variable, 100 to 900) for everything: display, headings, UI and body. Chosen for an Apple-like sharpness (the San Francisco family is the reference) that stays legible in long vignettes. Classes in the `components` layer: `.display` (tracking -0.045em, line-height 0.96, weight 700) for marketing headlines; `.heading` (tracking -0.03em) for product titles; `.eyebrow` (11.5px caps, weight 600, tracking 0.09em) for timing-screen labels.
- **Geist Mono** via `.readout` for telemetry data only: codes (AQ-1042), timings, deltas, channel indexes, the price "receipt". Tabular and slashed zero. Never for prose.
- **Source Serif 4** only for Library prose.
- Marketing display sizes use `clamp()`; the hero H1 is `clamp(34px, 9.4vw, 132px)` so "The USMLE Qbank" fits one line at 360px. Product scale stays fixed.
- Vignette text: 17px, line-height 1.65, max 72ch. Library prose: 18px serif, line-height 1.7, max 68ch.

## Elevation & Shape

- Radii: 4px controls, 6px panels, 8px marketing tiles and demos; full pills only for status chips.
- Depth by hairlines and tone shifts. Heavier 2px rules (`bg-text`) open key sections, like a timing-sheet header.
- Precision motifs: a tick-mark ruler along the edge of teal sections; a 12-column and 64px-row hairline grid behind the hero with a faint aqua accuracy trace and a sweeping scanner line.
- No glassmorphism, no gradient text, no coloured side-stripe borders.

## Components

- **Buttons**: `primary` (teal fill, light label), `secondary` (surface + border), `ghost`, `danger`; `ink` is the aqua CTA with ink text on carbon; `carbon` and `carbon-outline` are for teal surfaces. Bold labels.
- **Answer option**: selected = teal chip on `--brand-soft`; correct/incorrect use their semantic tints with icons.
- **Navigation**: active sidebar item is a carbon block with an aqua icon. Segmented controls invert the selected option (`bg-text text-bg`). The sidebar uses the compact logo (`<Logo size="sm" />`).
- **Answer trace** (marketing hero): 16 channel cells (8 x 2 on desktop, 4 x 4 on phones) light in sequence at 90ms intervals; good values in aqua, flags in amber; ARGO's verdict fades in after. Cycles through three example answers.
- **Selling points** (marketing): a timing-sheet table, one row per point (number, headline and copy, proof panel). Each row's rule draws across before its content fades up. The proofs differ on purpose: an exam spec list, the 16 data points on carbon, a price receipt.
- **Timing tower** (marketing): carbon panel, position / system / accuracy / trend columns, focus row in solid teal, rows reorder with layout animation, ARGO "team radio" line below.
- **Telemetry** (marketing): stacked channels sharing one x-axis, aqua primary channel with a soft fill, dashed aqua pit-stop lines for ARGO sessions.
- **School search** (onboarding, settings): ARIA combobox over `medical_schools`; typing keeps a free-text school, picking a suggestion links the listed one; the last option is always "Use “what you typed”".
- **Nugget badge**: gold diamond + "Nugget" on gold-soft.

## Layout

- 4px spacing base. Marketing container 1320px; app content 1240px; reading surfaces 72ch.
- Marketing order: teal hero (headline, ARGO line + CTAs, timing tower, answer trace) → **Why Argonaut: the three selling points** (real-exam questions, ARGO, $48 lifetime) → carbon ARGO telemetry → questions → Nuggets + Library split → carbon Daily Challenge → pricing → FAQ → teal closing call → carbon footer with a full-width wordmark.

## Motion

- Product: 150 to 220ms, ease-out-quart. Motion only for state.
- **The correct answer is the exception, on purpose.** In tutor mode and the Daily Challenge, a correct pick plays once: the check chip punches in (scale 0.6 → 1.12 → 1, 420ms), the tick draws, a ring pulses out with six short sparks, a light sweep crosses the row, the verdict bar fades up, and an "N in a row" chip counts up from 2 correct in a row (plus a 12ms haptic tap on phones). A wrong pick gets a 360ms nudge. Nothing replays when you navigate back. Timed blocks show nothing until review, so the exam surface stays calm.
- Marketing: Lenis smooth scroll; hero headline lines rise out of a mask on first paint (CSS, so it runs before hydration); reveals of 800ms with ease-out-expo (opacity + translate, no blur); timing-tower rows reorder every ~3.4s; telemetry traces draw on scroll; the hero scanner sweeps every 7s.
- Markup must not branch on `useReducedMotion()` (it is null on the server); handle reduced motion through `motion-safe:` / `motion-reduce:` classes and zero-duration transitions. Loops (tower, answer trace) stop under reduced motion.
- No elastic easing, no confetti, no sound.
