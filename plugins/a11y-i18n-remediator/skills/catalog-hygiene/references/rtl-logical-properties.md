# RTL Readiness, Logical Properties & Pitfalls

Most "we don't support Arabic/Hebrew" debt is physical, direction-baked CSS. Logical properties resolve to the correct physical side based on the element's writing direction (`dir`), so **one** stylesheet serves both LTR and RTL. This file is the complete substitution map plus the short list of things logical properties cannot fix.

The mechanical rewrites below are safe in both directions: under `dir="ltr"`, `margin-inline-start` *is* `margin-left`. Apply them freely. The pitfalls need human judgment, flag, do not auto-flip.

---

## Physical → Logical Property Map

### Box model
| Physical (LTR-baked) | Logical |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `margin-top` | `margin-block-start` |
| `margin-bottom` | `margin-block-end` |
| `padding-left` / `-right` | `padding-inline-start` / `-end` |
| `padding-top` / `-bottom` | `padding-block-start` / `-end` |
| `border-left` / `-right` | `border-inline-start` / `-end` |
| `border-top` / `-bottom` | `border-block-start` / `-end` |
| `border-top-left-radius` | `border-start-start-radius` |
| `border-top-right-radius` | `border-start-end-radius` |
| `border-bottom-left-radius` | `border-end-start-radius` |
| `border-bottom-right-radius` | `border-end-end-radius` |

### Positioning & sizing
| Physical | Logical |
|---|---|
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |
| `top` / `bottom` | `inset-block-start` / `-end` |
| `left: 0; right: 0` | `inset-inline: 0` |
| `width` (in a flow-relative layout) | `inline-size` |
| `height` | `block-size` |
| `min-width` / `max-width` | `min-inline-size` / `max-inline-size` |

### Text & alignment
| Physical | Logical |
|---|---|
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `float: left` / `right` | `float: inline-start` / `inline-end` |
| `clear: left` / `right` | `clear: inline-start` / `inline-end` |

### Shorthands worth knowing
- `margin-inline: <start> <end>` and `padding-inline: <start> <end>` set both horizontal logical sides at once.
- `inset-inline`/`inset-block` are the logical `inset` pairs.
- Flexbox/Grid are already direction-aware: `flex-direction: row` follows the inline axis, so `justify-content: flex-start` flips with `dir` for free, prefer them over floats.

---

## Framework/tooling notes
- **Tailwind:** use logical utilities `ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*` (RTL-aware) instead of `ml-*`/`mr-*`/`left-*`/`right-*`; or enable the RTL variant. `text-start`/`text-end` over `text-left`/`text-right`.
- **CSS-in-JS (styled-components/emotion):** the same property names apply; the `stylis-plugin-rtl` / `rtlcss` transform can flip legacy physical styles at build time, but native logical properties are preferable (no transform, no double-flip bugs).
- **PostCSS:** `postcss-logical` and `rtlcss` automate the substitution; still review the pitfalls below by hand.

---

## What Logical Properties CANNOT Fix (flag for a human)

1. **Directional icons.** Arrows (back/forward/next/prev), chevrons, "send", undo/redo, and progress indicators must **mirror** in RTL. Brand marks, logos, checkmarks, a clock, and media play buttons must **not** mirror. There is no CSS rule that knows which is which, a person decides per icon. Mirror with `[dir="rtl"] .icon-next { transform: scaleX(-1); }`.
2. **Transforms.** `translateX(20px)`, `transform-origin: left`, and skews are physical. Override under `[dir="rtl"]` (negate the X translation, swap the origin).
3. **Box shadows & gradients** with a horizontal offset that implies a light source (`box-shadow: 4px 0 …`) may need an RTL override to keep the light coming from the same visual side, or be made symmetric.
4. **background-position** and sprite offsets keyed to `left`/`right`: use `inline-start`/percentages, or override.
5. **Bidi text (the big one).** User-generated content that mixes scripts (an English name in an Arabic sentence, a phone number, a file path) needs Unicode bidi isolation, `dir="auto"` on the element, or wrap the run in `<bdi>`, or CSS `unicode-bidi: isolate`. CSS direction alone will not stop numbers/punctuation from jumping to the wrong end. This is a correctness issue, not cosmetic.
6. **Scroll & carousels.** Horizontal scroll position, "next slide" direction, and drag gestures are physical; they must follow reading direction.
7. **Keyline animations** that slide in "from the left", parameterize by inline direction.

---

## Direction Setup (prerequisite)
Logical properties do nothing until `dir` is actually set. Wire it to the active locale:
```html
<html lang="ar" dir="rtl">
```
- Set `dir` from the locale (RTL locales: Arabic `ar`, Hebrew `he`, Persian `fa`, Urdu `ur`, plus others) at the document root, and re-set it on locale change.
- For mixed-direction UI, set `dir` on the subtree, and use `dir="auto"` on containers of unknown-direction user content so the browser infers direction from the first strong character.
- Verify the app has *somewhere* that flips `dir`; if not, the first fix is to add it, otherwise every logical-property rewrite is inert.

---

## Audit Checklist
1. Grep for physical properties (`margin-left`, `padding-right`, `\bleft:`, `text-align:\s*left`, `float:\s*(left|right)`, Tailwind `ml-`/`mr-`/`left-`/`right-`).
2. Rewrite the mechanical ones to logical equivalents (safe in both directions).
3. List every directional icon, transform, offset-shadow, and background-position as a **manual caveat** with its `file:line`.
4. Scan for user-content containers lacking `dir="auto"`/`<bdi>`: flag as bidi risks.
5. Confirm `dir` is wired to the locale; if not, that is finding #1.
