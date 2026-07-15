---
description: Audit CSS/components for RTL readiness and rewrite physical properties to logical equivalents
argument-hint: [css-or-component-dir]
model: inherit
---

Audit the styles and components in `$ARGUMENTS` (or the current diff) for right-to-left readiness, and rewrite direction-hardcoded CSS into logical, bidi-safe equivalents. Most "we don't support Arabic/Hebrew yet" debt is a pile of physical `left`/`right` properties that a mechanical rewrite fixes safely; the rest is a short list of things that genuinely need human eyes. Load the `catalog-hygiene` skill's `references/rtl-logical-properties.md` for the property map and pitfalls.

## Process

### Step 1: Scope the styles
Read the target CSS/SCSS/Less, CSS-in-JS, Tailwind classes, and inline styles. Note whether the project already sets `dir="rtl"` anywhere, uses logical properties at all, or relies on a bidi library, this tells you whether you are starting a retrofit or finishing one.

### Step 2: Find physical, direction-hardcoded properties
Grep for the physical properties and flag each with `file:line`:

| Physical (LTR-baked) | Logical (direction-aware) |
|---|---|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `left` / `right` (offsets) | `inset-inline-start` / `inset-inline-end` |
| `text-align: left` / `right` | `text-align: start` / `end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `float: left` / `right` | `float: inline-start` / `inline-end` |
| `border-radius` per-corner | `border-start-start-radius` etc. |

### Step 3: Flag the things logical properties can't fix
These need judgment, not a find-replace, list them as caveats, do not blindly flip:

- **Directional icons**: back/forward/next arrows, chevrons, send icons must mirror; decorative or brand icons (a checkmark, a logo) must not.
- **Transforms**: `translateX`, `transform-origin`, and skews may need `[dir="rtl"]` overrides.
- **Box shadows / gradients** with an x-offset that implies a light direction.
- **Bidi text**: user content mixing scripts needs `dir="auto"` / Unicode isolation (`<bdi>`), not CSS.
- **Background-position** and sprite offsets keyed to a side.
- **Keyline borders and animations** that slide from a specific edge.

### Step 4: Rewrite and report
Rewrite the mechanical physical→logical substitutions in place (they are safe in both directions, logical properties resolve to physical ones under `dir="ltr"`). Emit exactly these sections:
- `## Physical Properties Rewritten`: the before/after diff, grouped by file.
- `## Manual RTL Caveats`: the Step-3 list with the specific `file:line` and what a human must decide (mirror this icon? add a `[dir]` override?).
- `## Direction Setup`: whether `dir` is wired to the active locale and where to set it if not.

## Important Notes
- Base every rewrite on real declarations, cite each `file:line`; never invent a rule that isn't in the source.
- Logical-property rewrites are safe defaults, but verify with a component that has an explicit LTR-only design intent before flipping it.
- Do not mirror an icon just because it is directional in code, brand and semantically-fixed glyphs stay put; flag, don't auto-mirror.
- Setting `dir` correctly at the document/root per locale is a prerequisite; logical properties do nothing until direction is actually set.
