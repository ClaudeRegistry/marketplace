# Focus Management, Recipes

Focus behavior is the accessibility work automated tools miss most, because it is *behavior over time*, not a static attribute. These are the recipes for the six recurring problems, tech-agnostic first, then per-framework. Each names the WCAG success criterion it satisfies.

---

## 1. Skip Link (2.4.1 Bypass Blocks)

The first focusable element on the page jumps past repeated navigation.

```html
<a href="#main" class="skip-link">Skip to content</a>
...
<main id="main" tabindex="-1">…</main>
```
```css
.skip-link { position: absolute; left: -9999px; }
.skip-link:focus { left: 0; top: 0; }   /* visible only when focused */
```
The target needs `tabindex="-1"` so focus can land on a non-interactive `<main>`. Do not hide the link with `display:none` (it removes it from the tab order).

---

## 2. Visible Focus (2.4.7 Focus Visible)

Never `outline: none` without a replacement. Use `:focus-visible` so the ring shows for keyboard users but not on mouse click.

```css
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }   /* suppress ring on pointer focus */
```
The 2.4.11 (WCAG 2.2) criterion additionally requires the focused control not be fully obscured by sticky headers/footers, verify the ring is not hidden behind a fixed element.

---

## 3. Focus Trap (2.1.2 No Keyboard Trap, in the *good* sense for modals)

While a modal is open, `Tab`/`Shift+Tab` must cycle within it. Compute the focusable set and wrap at both ends.

```js
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),' +
  'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function trap(container, e) {
  if (e.key !== 'Tab') return;
  const items = [...container.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
}
```
Better: a native `<dialog>` opened with `.showModal()` traps focus, renders the rest of the document inert, and closes on `Escape`: no JS trap needed.

---

## 4. Move-In and Restore (2.4.3 Focus Order)

On open, move focus into the dialog (its first control, or the dialog itself). On close, restore focus to the element that opened it, otherwise the keyboard user is dumped at the top of the page.

```js
let opener;
function openDialog(dialog) {
  opener = document.activeElement;        // remember the trigger
  dialog.showModal();
  (dialog.querySelector(FOCUSABLE) || dialog).focus();
}
function closeDialog(dialog) {
  dialog.close();
  opener?.focus();                        // restore
}
```

---

## 5. Background Inertness (1.3.1 / 4.1.2)

Content behind a modal must not be tabbable or announced. Prefer the `inert` attribute on the page root (native `<dialog>` does this automatically); fall back to `aria-hidden="true"` plus removing tabbability.

```js
mainRoot.inert = true;   // on open
mainRoot.inert = false;  // on close
```

---

## 6. Roving Tabindex vs aria-activedescendant (2.1.1 Keyboard)

A composite widget (menu, tablist, listbox, toolbar, radiogroup) is **one** tab stop; arrow keys move *within* it. Two implementations:

**Roving tabindex**: exactly one child has `tabindex="0"`, the rest `tabindex="-1"`; arrow keys move `tabindex="0"` and call `.focus()` on the new child. Use when DOM focus should move (menus, tabs, toolbars).

```js
function move(items, from, to) {
  items[from].tabIndex = -1;
  items[to].tabIndex = 0;
  items[to].focus();
}
```

**aria-activedescendant**: DOM focus stays on the container/input; the id in `aria-activedescendant` marks the "virtual" active child. Use when focus must stay put (combobox input, so typing keeps working).

Never leave every child at `tabindex="0"` (that makes N tab stops) or use positive `tabindex` values (they hijack the global order, 2.4.3).

---

## Per-Framework Lifecycle Hooks

| Framework | Move-in / restore hook | Notes |
|---|---|---|
| React | `useEffect(() => { ref.current.focus(); return () => opener.focus(); }, [open])` | store opener in a `useRef`; use `inert` on the app root |
| Vue | `watch(open, v => v ? nextTick(() => ref.value.focus()) : opener.focus())` | `nextTick` so the node exists |
| Svelte | `$: if (open) tick().then(() => node.focus())`; `use:` action for the trap | actions are ideal for trap/inert |
| Angular | `ngAfterViewInit` / a `@ViewChild` + `cdkTrapFocus` (CDK a11y) | `FocusTrap` and `LiveAnnouncer` are built in |
| Plain HTML | `<dialog>.showModal()` + `close` event | least code, most correct |

---

## Manual Verification (always required)
Static code cannot fully prove focus behavior. Confirm by keyboard: Tab from the top (skip link appears first), open the widget (focus moves in), Tab to the end and past (it wraps, does not escape), press `Escape` (it closes, focus returns to the trigger), and drive any composite with the arrow keys (one tab stop, arrows move inside).
