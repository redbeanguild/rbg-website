# RBG Design System

> Visual language for the Red Bean Guild Collector Profile.  
> Brutalist. Raw. Structured. Every pixel intentional.

---

## Philosophy

The RBG design system is built on **contrast as communication**. Black and white define the structure. Red fires only when something matters — active state, a rank earned, a system alert, a locked piece unlocked.

No gradients on backgrounds. No rounded corners. No drop shadows. No decorative elements that don't carry information.

The grid is always visible. Structure is the aesthetic.

---

## Color

```css
:root {
  --rbg-black:      #0A0A0A;   /* Page background */
  --rbg-offblack:   #111111;   /* Card / block background */
  --rbg-white:      #F2F0EB;   /* Primary text, borders */
  --rbg-red:        #E8000A;   /* Accent — use sparingly */
  --rbg-muted-1:    rgba(242, 240, 235, 0.40);  /* Secondary text */
  --rbg-muted-2:    rgba(242, 240, 235, 0.25);  /* Tertiary / metadata */
  --rbg-muted-3:    rgba(242, 240, 235, 0.08);  /* Borders, dividers */
  --rbg-red-dim:    rgba(232, 0, 10, 0.06);     /* Active row tint */
  --rbg-grid:       rgba(242, 240, 235, 0.04);  /* Background grid lines */
}
```

### Red usage rules

Red is a signal. It should never appear decoratively.

| Use red for | Never use red for |
|---|---|
| Active tab / selected state | Body text |
| Current rank indicator | Background fills |
| Locked → unlocked transition | Hover states on inactive elements |
| XP bar fill | Borders on non-active components |
| Blinking live indicator | Decorative dividers |
| Left-border active stripe | Section headers |
| CTAs / primary actions | Icons |

---

## Typography

Two fonts. No others.

```css
--font-display: 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-mono:    'Courier New', Courier, monospace;
```

### Helvetica Neue — Display & Structure

Used for: names, headings, rank numerals, stats, navigation labels, tab labels, buttons.

```css
/* Page title / brand mark */
font-family: var(--font-display);
font-weight: 900;
font-size: 18px;
letter-spacing: 0.12em;

/* Section heading */
font-family: var(--font-display);
font-weight: 900;
font-size: 14px;
letter-spacing: 0.10em;

/* Stat value (large) */
font-family: var(--font-display);
font-weight: 900;
font-size: 20px;
letter-spacing: -0.01em;

/* Body / perk text */
font-family: var(--font-display);
font-weight: 400;
font-size: 13px;
letter-spacing: 0.02em;
```

### Courier New — Metadata & System

Used for: labels, timestamps, thresholds, kanji transliterations, code, system status, XP values, drop tags, rank slugs.

```css
/* Label / tag */
font-family: var(--font-mono);
font-size: 9px;
letter-spacing: 0.20em;
text-transform: uppercase;

/* Lore / quote text */
font-family: var(--font-mono);
font-size: 11px;
font-style: italic;
letter-spacing: 0.01em;
line-height: 1.75;

/* Inline metadata */
font-family: var(--font-mono);
font-size: 8px;
letter-spacing: 0.15em;
```

### Type scale

| Role | Font | Weight | Size | Tracking |
|---|---|---|---|---|
| Brand mark | Helvetica | 900 | 18px | 0.12em |
| Collector name | Helvetica | 900 | 22px | 0.06em |
| Rank numeral | Helvetica | 900 | 24px | 0em |
| Stat value | Helvetica | 900 | 20px | -0.01em |
| Section heading | Helvetica | 900 | 14px | 0.10em |
| Perk / body text | Helvetica | 400 | 13px | 0.02em |
| System label | Courier | 400 | 9px | 0.20em |
| Metadata | Courier | 400 | 8px | 0.15em |
| Lore / quote | Courier | 400 | 11px | 0.01em |
| Drop tag | Courier | 400 | 8px | 0.15em |

---

## Background & Grid

The page background always has a faint grid overlay. It's structural texture, not decoration.

```css
body {
  background-color: var(--rbg-black);
  background-image:
    linear-gradient(var(--rbg-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--rbg-grid) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

---

## Borders & Dividers

All borders use `--rbg-muted-3` by default. Never use border-radius except where explicitly noted (none currently).

```css
/* Standard border */
border: 1px solid rgba(242, 240, 235, 0.08);

/* Stronger border (hero block, major sections) */
border: 1px solid rgba(242, 240, 235, 0.12);

/* Active / selected border */
border: 1px solid rgba(232, 0, 10, 0.35);

/* Active left stripe */
border-left: 3px solid #E8000A;
```

No `border-radius`. No `box-shadow`. No `outline`.

---

## Spacing

Base unit: `4px`. All spacing is a multiple of 4.

```
4px   — tight inline gap (icon + label)
8px   — component internal padding (small)
12px  — component internal padding (standard)
16px  — section padding horizontal
20px  — page horizontal padding
24px  — between major sections
32px  — page vertical padding (hero)
```

---

## Components

### Topbar

- Height: `48px`
- Background: `var(--rbg-black)` with `backdrop-filter: blur(20px)` when sticky
- Left: brand mark (Helvetica 900, `RBG` + red period)
- Center: rank pip indicators (clickable)
- Right: `GUILD REGISTRY` label (Courier, muted)
- Border bottom: `1px solid rgba(242,240,235,0.12)`
- `position: sticky; top: 0; z-index: 20`

### Ticker

- Height: `22px`
- Background: `var(--rbg-red)`
- Text: Courier 9px, white, `letter-spacing: 0.2em`
- Animation: infinite horizontal scroll marquee
- Content: `RBG GUILD REGISTRY ——— PRODUCTS ARE ARMOR FOR YOUR ARC ———`

### Hero Block

- Background: `var(--rbg-offblack)` or `var(--rbg-black)` — no gradient
- Padding: `32px 20px 0`
- Avatar: `80×80px` box, `1px solid rgba(242,240,235,0.15)`, Helvetica 900 initial
- Red corner pip: `8×8px` block, `background: var(--rbg-red)`, bottom-right of avatar
- Rank badge: `36×36px` box, `border: 1px solid var(--rbg-red)`, centered rank numeral in red
- XP bar: `3px` tall, full width, `var(--rbg-red)` fill on dark track
- Stats row: 4-column grid, `1px` dividers, first stat value in red
- Lore block: `border-left: 3px solid rgba(232,0,10,0.44)`, Courier italic

### Tabs

- Full-width 3-column grid
- Active tab: `background: var(--rbg-red)`, white text
- Inactive tab: transparent background, muted text
- Font: Helvetica 700, 10px, `letter-spacing: 0.2em`
- No border-radius. Hard edges.
- Border bottom: `1px solid rgba(242,240,235,0.12)`

### Perk Row

```
height: auto (min ~44px)
padding: 14px 20px
border-bottom: 1px solid rgba(242,240,235,0.07)
hover: background rgba(242,240,235,0.03)

Left:  red dash  —   (Courier 10px, var(--rbg-red))
Body:  perk text     (Helvetica 400 13px)
Right: ✓ or ✗        (Courier 8px, muted)
```

Locked perks: `opacity: 0.3`, ✗ mark.

### Rank Row

```
padding: 15px 16px
border-bottom: 1px solid rgba(242,240,235,0.08)
hover: background rgba(242,240,235,0.025)
active: background rgba(232,0,10,0.06)

Left stripe (active only): 3px × full height, var(--rbg-red)
Rank numeral column: 64px wide, centered
  — active: var(--rbg-red), Helvetica 900 24px
  — achieved: rgba(242,240,235,0.40)
  — locked: rgba(242,240,235,0.12)
Status mark (right): ✦ in red if achieved, ◌ if locked
```

Blinking `● ACTIVE` label on current rank: `animation: blink 2s step-end infinite`.

### Wardrobe Grid

- 3 columns, `gap: 0` (borders create the grid)
- Cell aspect ratio: `1:1`
- Owned cell: `background rgba(242,240,235,0.02)`, hover tints red `rgba(232,0,10,0.06)`
- Locked cell: `opacity: 0.25`, no hover
- Piece number watermark: Helvetica 900, 52px, `rgba(232,0,10,0.08)`, bottom-right absolute
- Drop tag: Courier 8px, muted, top-left
- Piece name: Helvetica 700, 10px, bottom-left
- Owned indicator: `16×1px` red bar under piece name

### XP / Progress Bar

```css
.xp-track {
  height: 3px;
  background: rgba(255,255,255,0.08);
}
.xp-fill {
  height: 100%;
  background: var(--rbg-red);
  transition: width 1s ease;
}
```

No rounded ends. Hard cap.

---

## Motion & Animation

Minimal. Only three animation types are used:

```css
/* Page / tab transition */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Apply: animation: fadeUp 0.35s ease on tab content mount */

/* Live indicator / active rank blink */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
/* Apply: animation: blink 2s step-end infinite */

/* Ticker tape */
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
/* Apply: animation: marquee 18s linear infinite */
```

No bounce. No spring. No blur transitions. No scale effects on hover — only background color changes.

---

## Interaction States

| State | Treatment |
|---|---|
| Default | Base styles, no modification |
| Hover (row) | Background: `rgba(242,240,235,0.03)` |
| Hover (wardrobe, owned) | Background: `rgba(232,0,10,0.06)` |
| Active / selected | Red left stripe + red tint bg |
| Locked | `opacity: 0.25–0.30`, cursor: default |
| Disabled | Same as locked |
| Focus | `outline: 1px solid var(--rbg-red)` |

No transform on hover. No scale. No elevation.

---

## Cursor

```css
/* Default */
cursor: default;

/* Clickable rows, tabs, rank nodes */
cursor: pointer;

/* Locked wardrobe cells */
cursor: not-allowed;
```

Optionally: a custom crosshair cursor on the page body for full brutalist commitment.

```css
body {
  cursor: crosshair;
}
```

---

## Scrollbar

```css
::-webkit-scrollbar       { width: 3px; }
::-webkit-scrollbar-track { background: var(--rbg-black); }
::-webkit-scrollbar-thumb { background: var(--rbg-red); }
```

---

## Selection

```css
::selection {
  background: var(--rbg-red);
  color: var(--rbg-white);
}
```

---

## Do / Don't

| ✓ Do | ✗ Don't |
|---|---|
| Hard edges everywhere | `border-radius` on any element |
| Red only on active/earned states | Red as a background color |
| Courier for all metadata and labels | Mix fonts beyond Helvetica + Courier |
| Visible grid on page background | Gradient backgrounds |
| 1px borders to define all components | `box-shadow` or `drop-shadow` |
| `opacity` to communicate locked states | Hide locked items entirely |
| Flat hover — color only, no movement | Scale, translate, or rotate on hover |
| `step-end` timing for blink animation | `ease` or `bounce` on blink |
| Show locked wardrobe pieces (grayed) | Remove locked pieces from the grid |

---

## Responsive Notes

The profile is primarily a mobile-first layout. Max content width: `600px`, centered.

- Page padding: `20px` horizontal on mobile
- Wardrobe grid: 3 columns always — do not collapse to 2
- Stats row: 4 columns always — allow text to truncate if needed
- Topbar: sticky at all breakpoints
- Ticker: always visible, does not collapse

---

*RBG Design System — v1.0*  
*Collector Profile · Red Bean Guild 2.0*
