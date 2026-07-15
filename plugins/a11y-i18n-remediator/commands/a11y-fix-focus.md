---
description: Fix keyboard and focus-management problems in a component and emit before/after diffs
argument-hint: [component]
model: inherit
---

Fix the keyboard-operability and focus-management defects in the component at `$ARGUMENTS` (or the components in the current diff), and produce reviewable before/after diffs annotated with the WCAG success criterion each change satisfies. Focus management is exactly the class of problem automated scanners miss, it is about *behavior over time* (what happens when a dialog opens, where focus goes when it closes), not a single element's attributes. This command dispatches the **a11y-remediator** agent and loads the `wcag-remediation` skill's focus-management recipes.

## Process

### Step 1: Detect the widget type and framework
Read the target. Identify what interaction pattern the component implements, modal dialog, dropdown menu, combobox/autocomplete, tabs, disclosure/accordion, listbox, or a custom composite, and the framework (React, Vue, Svelte, Angular, plain HTML). The correct focus behavior is defined by the ARIA Authoring Practices pattern for that widget; look it up in the skill's `references/aria-patterns.md`.

### Step 2: Diagnose the focus defects
Check each behavior and cite `file:line`:

| Defect | Symptom in code | WCAG SC |
|---|---|---|
| No focus trap | A modal renders without confining Tab/Shift+Tab to its contents | 2.1.2, 2.4.3 |
| Focus not moved in | Dialog opens but focus stays on the page behind it | 2.4.3 |
| Focus not restored | Dialog closes without returning focus to the trigger | 2.4.3 |
| Background not inert | Content behind the modal is still tabbable / read by AT | 1.3.1, 4.1.2 |
| No visible focus | `outline: none` with no `:focus-visible` replacement | 2.4.7 |
| Missing skip link | No "skip to content" before a long repeated nav | 2.4.1 |
| Wrong tabindex | Positive `tabindex`, or every composite child in the tab order | 2.4.3 |
| No roving tabindex | Menu/tablist/listbox where arrow keys don't move focus | 2.1.1 |

### Step 3: Apply the fixes via the a11y-remediator agent
Launch the **a11y-remediator** agent to edit the component. It applies the framework-idiomatic recipe for each defect: a focus trap that cycles at both ends, `useEffect`/`onMount`/`ngAfterViewInit` to move focus in on open and restore it on close, `inert`/`aria-hidden` on the background, a `:focus-visible` style, a skip link, and roving `tabindex` (or `aria-activedescendant`) with the arrow-key handler the pattern requires.

### Step 4: Report
Emit exactly these sections:
- `## Focus Defects`: the diagnosis table from Step 2.
- `## Before / After`: a diff per fix, each headed with the WCAG SC it satisfies and one line on the behavior it corrects.
- `## Manual Verification`: the keyboard walkthrough to confirm by hand (Tab through, open/close the dialog, Escape, arrow keys), because focus behavior is not fully provable from static code.

## Important Notes
- Ground every fix in the real component code, cite the `file:line` of the handler or element you changed.
- Prefer the platform: a native `<dialog>` with `showModal()` gives you a trap, inertness, and Escape for free; reach for it before hand-rolling.
- Never remove a focus outline without providing a `:focus-visible` replacement, that regresses 2.4.7.
- Roving tabindex vs `aria-activedescendant` is a real choice: keep exactly one tab stop for the whole composite, not one per child.
