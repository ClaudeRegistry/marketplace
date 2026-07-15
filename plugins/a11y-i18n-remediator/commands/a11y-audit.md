---
description: Audit UI for WCAG 2.2 violations and report each grouped by success criterion with a concrete fix
argument-hint: [file-or-dir]
model: inherit
---

Audit the UI in `$ARGUMENTS` (or the components in the current diff if no path is given) for WCAG 2.2 conformance failures, and report each finding grouped by the success criterion it violates, with a severity and the concrete fix. This is a **static** audit, it reads source, not a running page, so it catches the structural and cross-element problems that a rendered-DOM scanner cannot. Load the `wcag-remediation` skill for the ARIA-pattern and focus-management catalogs.

## Process

### Step 1: Detect the framework and markup dialect
Read the target files. Determine the stack so you apply the right idioms:

| Stack | Signal |
|---|---|
| React / JSX | `.jsx`/`.tsx`, `className`, `onClick`, `import React` |
| Vue SFC | `.vue`, `<template>`, `v-bind`, `@click` |
| Svelte | `.svelte`, `on:click`, `{#if}` |
| Angular | `.component.html`, `*ngIf`, `(click)`, `[attr.aria-*]` |
| Plain HTML | `.html`, raw `<button>`/`<div>` markup |

Note the component library too (MUI, Chakra, Radix, Headless UI, Vuetify, Angular Material), many ship accessible primitives that a hand-rolled `<div onClick>` is reinventing badly.

### Step 2: Run the WCAG 2.2 checklist
For every interactive or content element, check each category and record the exact `file:line`:

| Category | What to flag | WCAG SC |
|---|---|---|
| Color contrast | Text/token pairs below 4.5:1 (3:1 for large text), UI-component/state contrast below 3:1 | 1.4.3, 1.4.11 |
| Text alternatives | `<img>` with no `alt`, icon-only buttons with no accessible name, decorative images missing `alt=""` | 1.1.1 |
| Labels & names | Inputs with no associated `<label>`/`aria-label`/`aria-labelledby`, placeholder-as-label | 1.3.1, 3.3.2, 4.1.2 |
| ARIA misuse | Invalid `role`, `aria-*` on an element that does not support it, redundant role (`role="button"` on `<button>`), `aria-hidden` on a focusable element | 4.1.2 |
| Keyboard operability | `onClick` on a non-interactive element with no `role`/`tabIndex`/key handler, positive `tabindex`, focus traps, no visible focus | 2.1.1, 2.1.2, 2.4.7 |
| Focus order | DOM order that does not match reading order, focus lost when a dialog closes | 2.4.3 |
| Headings & landmarks | Skipped heading levels, multiple `<h1>`, missing `<main>`/`<nav>` landmarks | 1.3.1, 2.4.6 |
| Name/role/value | Custom widgets missing the required state (`aria-expanded`, `aria-checked`, `aria-selected`) | 4.1.2 |
| Target size (2.2) | Interactive targets under 24×24 CSS px with no spacing exception | 2.5.8 |

### Step 3: Classify severity
Rate each finding **Critical** (blocks a task for a screen-reader or keyboard user, e.g. an unlabeled submit control, a keyboard trap), **Serious** (materially degrades access, low contrast, wrong ARIA state), or **Moderate** (should fix, heading skip, redundant role). Note whether a fix is mechanical (safe to apply) or needs human judgment (meaningful `alt` text, correct focus order intent).

### Step 4: Report
Emit exactly these sections:
- `## Summary`: counts by severity and by category.
- `## Findings by Success Criterion`: one subsection per violated SC (e.g. `### 1.1.1 Non-text Content`), each with a table: `Severity | file:line | Problem | Fix`.
- `## Suggested Remediation`: which findings `/a11y-fix-focus` or the a11y-remediator agent can apply automatically, and which need human input (flag, do not guess, meaningful alt text).

## Important Notes
- Base every finding on the real markup, cite the exact `file:line`; never fabricate a violation.
- Static contrast checks need both colors resolved from tokens/variables; if a color is computed at runtime, mark the finding "needs verification" rather than asserting a ratio.
- Never invent `alt` text for a meaningful image, flag it for a human to describe.
- A redundant ARIA role is a real finding, but prefer removing ARIA over adding it: the first rule of ARIA is do not use ARIA when a native element will do.
