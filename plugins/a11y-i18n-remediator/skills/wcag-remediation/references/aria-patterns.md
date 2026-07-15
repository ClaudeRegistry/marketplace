# ARIA Authoring Practices, Pattern Catalog

The correct roles, states, and keyboard contract for the widgets people most often hand-roll incorrectly. Apply the *complete* pattern, a lone `role` without its states and keyboard handlers is worse than no ARIA. Every custom widget must satisfy 4.1.2 (Name, Role, Value) and 2.1.1 (Keyboard).

Rule zero: if a native element does the job, use it and skip this file. `<dialog>`, `<button>`, `<details>`/`<summary>`, `<select>`, and `<input>` bring these contracts for free.

---

## Dialog (Modal)

**Structure/roles:** container `role="dialog"` (or native `<dialog>`), `aria-modal="true"`, and an accessible name via `aria-labelledby` (pointing at the title) or `aria-label`.

**States:** none intrinsic; the *behavior* is the contract, see focus-management.md.

**Keyboard:**
| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | cycle focus **within** the dialog only (trap) |
| `Escape` | close the dialog, restore focus to the trigger |
| `Enter` | activate the focused control / default action |

**Must also:** move focus into the dialog on open, restore it to the opener on close, and make the background `inert`/`aria-hidden`. Native `<dialog>.showModal()` provides trap, inertness, and Escape automatically.

---

## Disclosure (Show/Hide, Accordion)

**Roles:** a `<button>` toggles a region. No special role needed on the button.

**States:** `aria-expanded="true|false"` on the button; `aria-controls="<region-id>"` pointing at the toggled content. For an accordion, each header button carries its own `aria-expanded`.

**Keyboard:** `Enter`/`Space` toggle (native `<button>` gives this for free). Accordion adds optional `Up`/`Down` to move between headers.

This is the pattern most often faked with a clickable `<div>`: replacing it with a `<button aria-expanded>` fixes keyboard, role, and state at once.

---

## Menu Button (Actions Menu)

**Roles:** trigger `<button aria-haspopup="menu">`; popup `role="menu"`; each item `role="menuitem"` (or `menuitemcheckbox`/`menuitemradio`).

**States:** `aria-expanded` on the button; `aria-checked` on checkable items. Manage focus with **roving tabindex** or `aria-activedescendant`: exactly one tab stop for the whole menu.

**Keyboard:**
| Key | Action |
|---|---|
| `Enter`/`Space`/`Down` | open menu, focus first item |
| `Up`/`Down` | move between items (wraps) |
| `Escape` | close, return focus to the button |
| `Home`/`End` | first / last item |
| type-ahead | focus item starting with the typed character |

Note: a *navigation* menu is a list of links, not this pattern, do not put `role="menu"` on your site nav. `role="menu"` is for application action menus.

---

## Tabs

**Roles:** container `role="tablist"`; each tab `role="tab"`; each panel `role="tabpanel"`.

**States:** the active tab has `aria-selected="true"` (others `false`); each tab has `aria-controls="<panel-id>"`; each panel has `aria-labelledby="<tab-id>"`. Inactive tabs are `tabindex="-1"`, the active tab `tabindex="0"` (roving).

**Keyboard:**
| Key | Action |
|---|---|
| `Left`/`Right` (horizontal) or `Up`/`Down` (vertical) | move between tabs |
| `Home`/`End` | first / last tab |
| `Enter`/`Space` | activate (only if manual activation) |

Choose automatic activation (panel shows on focus) for cheap panels, manual (activate on Enter/Space) when showing a panel is expensive.

---

## Combobox (Autocomplete / Select)

**Roles:** the text input has `role="combobox"`; the popup list is `role="listbox"` with `role="option"` children.

**States:** `aria-expanded` on the input; `aria-controls`/`aria-owns` to the listbox; `aria-activedescendant="<option-id>"` marks the visually highlighted option while DOM focus stays in the input; the chosen option is `aria-selected="true"`; add `aria-autocomplete="list|both"`.

**Keyboard:**
| Key | Action |
|---|---|
| `Down`/`Up` | open list / move active option |
| `Enter` | commit the active option |
| `Escape` | close list (and optionally clear) |
| `Home`/`End` | first / last option |

`aria-activedescendant` (not roving tabindex) is the right focus model here, the caret must stay in the input so typing keeps working.

---

## Listbox

**Roles:** container `role="listbox"`; children `role="option"`; group with `role="group"` + `aria-labelledby` if needed.

**States:** `aria-selected` on options; `aria-multiselectable="true"` on the container for multi-select; accessible name via `aria-labelledby`/`aria-label`. Roving tabindex across options.

**Keyboard:** `Up`/`Down` move, `Home`/`End` jump, `Space` toggles selection (multi-select), `Shift+Arrow`/`Ctrl+A` extend selection.

---

## Verification Checklist For Any Pattern
- Does the widget have an accessible **name** (1.1.1 / 4.1.2)?
- Is its **role** correct and non-redundant?
- Are all **states** present and updated (`aria-expanded`, `aria-selected`, `aria-checked`, `aria-activedescendant`)?
- Is there exactly **one tab stop** for a composite, with arrow-key navigation inside?
- Does `Escape` dismiss, and does focus go somewhere sensible after?
- Are `aria-controls`/`aria-labelledby` id references valid and present in the DOM?

Never leave a pattern half-applied. If any row above is missing, the widget still fails 4.1.2 even though a linter sees a valid `role`.
