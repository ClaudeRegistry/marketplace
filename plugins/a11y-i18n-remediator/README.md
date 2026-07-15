# A11y & i18n Remediator

Goes past detecting accessibility and localization problems to actually fixing them, in your editor, as reviewable diffs, grounded in real `file:line` evidence.

## Purpose

The European Accessibility Act became enforceable in June 2025, with penalties up to 4% of revenue, yet automated scanners only get you so far: axe-core catches roughly 57% of WCAG issues, and `jsx-a11y` is structurally blind to relationships between elements, it cannot connect a control to a label in another subtree, decide whether a chosen ARIA pattern is complete, or reason about what happens to focus when a dialog closes. Every tool flags problems; almost none apply the fix.

i18n retrofits are worse. Hardcoded-string extraction, catalog hygiene, ICU pluralization, and RTL support are heuristic-incomplete in existing CLIs: they miss which strings are actually user-facing, generate keys that churn on every copy edit, concatenate sentence fragments that break in other grammars, and leave you to discover at runtime that Polish needs four plural forms and Arabic needs six.

This plugin does the boring remediation work. It audits UI for WCAG 2.2, then applies cross-element ARIA and keyboard-focus fixes; it extracts hardcoded strings into your catalog with stable keys and correct ICU; it audits catalogs for missing/unused/untranslated keys and plural-category gaps; and it rewrites direction-baked CSS into logical, RTL-ready properties. Everything is static and diff-aware, it runs on the files you are already editing, never machine-translates, and never guesses `alt` text for meaningful images.

## Features

- Audits UI for WCAG 2.2 across React, Vue, Svelte, Angular, and plain HTML, contrast, labels/alt text, ARIA misuse, keyboard operability, focus order, headings, landmarks, form associations, name/role/value, and target size.
- Applies cross-element accessibility fixes a linter cannot: connects controls to labels across the DOM, wires the complete APG pattern for a widget, remaps a failing color to the nearest accessible token, and fixes focus management.
- Extracts hardcoded user-facing strings into the catalog and rewrites call sites idiomatically for react-i18next, react-intl/FormatJS, vue-i18n, next-intl, i18next, Angular i18n, and gettext.
- Preserves interpolation and pluralization as correct ICU MessageFormat, with the exact CLDR plural categories each language needs.
- Audits translation catalogs for missing keys, unused keys, untranslated values, placeholder drift, ICU syntax errors, and missing plural categories, with per-locale coverage.
- Rewrites physical CSS (`margin-left`, `left`, `text-align: left`) into logical, direction-agnostic properties and flags the RTL work that needs human judgment.
- Never machine-translates, never fabricates alt text or contrast ratios, it flags what needs a human and cites the WCAG success criterion behind every change.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install a11y-i18n-remediator@clauderegistry
```

## Commands

### /a11y-audit

```
/a11y-audit src/components/Checkout.tsx
```

**What it does:**
- Detects the framework and component library, then runs the full WCAG 2.2 checklist over the target.
- Checks color contrast, missing/empty labels and alt text, ARIA misuse, keyboard operability, focus order, heading/landmark structure, form associations, name/role/value, and target size.
- Reports findings grouped by the success criterion they violate, each with a severity and the concrete fix, and marks which fixes can be applied automatically vs which need human input.

**Best for:**
- A pre-merge accessibility pass on a component or feature.
- Turning a scanner's shallow flag into a prioritized, criterion-mapped fix list.

### /a11y-fix-focus

```
/a11y-fix-focus src/components/Modal.tsx
```

**What it does:**
- Identifies the widget pattern (dialog, menu, combobox, tabs, disclosure, listbox) and diagnoses focus defects.
- Dispatches the a11y-remediator agent to add a focus trap, move focus in on open, restore it on close, make the background inert, add `:focus-visible`, a skip link, and roving tabindex.
- Emits before/after diffs, each headed with the WCAG SC it satisfies, plus the keyboard walkthrough to verify by hand.

**Best for:**
- The focus and keyboard problems rendered-DOM scanners cannot catch.
- Making a modal or composite widget fully keyboard-operable.

### /i18n-extract

```
/i18n-extract src/features/checkout
```

**What it does:**
- Detects the i18n framework and catalog layout, then finds hardcoded user-facing strings while skipping keys, logs, routes, and test ids.
- Dispatches the i18n-extractor agent to add stable, semantic keys to the source locale and rewrite each call site with the framework idiom (`t()`, `<Trans>`, `$t`, `formatMessage`, `$localize`).
- Preserves interpolation and pluralization as correct ICU and leaves target locales empty for translators.

**Best for:**
- Internationalizing a component or feature that shipped in hardcoded English.
- Replacing string concatenation with translator-safe ICU messages.

### /i18n-doctor

```
/i18n-doctor locales
```

**What it does:**
- Cross-references the keys used in code against every locale file.
- Reports missing keys, unused keys, untranslated values, placeholder drift, ICU syntax errors, and missing plural categories per language.
- Emits a per-locale health report with coverage plus an ordered, mechanical-vs-translator fix list.

**Best for:**
- Catching broken or incomplete translations before they reach non-default-language users.
- Cleaning cruft and verifying plural correctness across all locales.

### /rtl-ready

```
/rtl-ready src/styles
```

**What it does:**
- Finds physical, direction-baked CSS (`margin-left`, `left`, `text-align: left`, per-corner radius, floats).
- Rewrites the mechanical substitutions into logical properties (`margin-inline-start`, `inset-inline-start`, `text-align: start`) that serve both directions.
- Flags what logical properties cannot fix, mirrored icons, x-axis transforms, directional shadows, and bidi text, as manual caveats with `file:line`.

**Best for:**
- Preparing a UI for Arabic, Hebrew, Persian, or Urdu without a full rewrite.
- Auditing whether `dir` is even wired to the active locale.

## Agents

### a11y-remediator

**Triggers when:** you ask to "fix the accessibility issues", "make this component accessible", "add ARIA", "fix the focus trap", "this button has no label", or "fix keyboard navigation", or when `/a11y-fix-focus` dispatches it.

**What it does:** Applies WCAG 2.2 fixes with cross-element reasoning that linters cannot do, connects a control to its label across the DOM, chooses and fully wires the correct ARIA pattern from the surrounding structure, maps a failing color to the nearest accessible design token, and fixes focus management. It has `Edit` because applying the fix is its job, it explains the success criterion behind every change, and it never guesses alt text for a meaningful image, it flags those for a human instead.

### i18n-extractor

**Triggers when:** you ask to "extract these strings", "internationalize this component", "move hardcoded text to the catalog", "wrap these strings in t()", or say "these strings aren't translatable", or when `/i18n-extract` dispatches it.

**What it does:** Extracts hardcoded strings to the catalog and rewrites call sites idiomatically per framework (react-i18next, react-intl/FormatJS, vue-i18n, next-intl, i18next, Angular i18n, gettext). It generates stable, semantic keys, preserves interpolation and pluralization by emitting correct ICU, skips code-facing strings, and never machine-translates, it leaves target locales empty for translators.

## Skills

Skills auto-activate from keywords and carry the deep methodology the commands and agents consume, commands orchestrate, skills hold the catalogs.

### wcag-remediation

The WCAG 2.2 remediation methodology and the cross-element fixes automated tools miss. Reference files:
- `references/aria-patterns.md`: the ARIA Authoring Practices patterns (dialog, menu, combobox, tabs, disclosure, listbox) with correct roles, states, and the full keyboard-interaction contract.
- `references/focus-management.md`: focus-order, focus-trap, focus-restoration, skip-link, `:focus-visible`, and roving-tabindex / `aria-activedescendant` recipes across frameworks.

### icu-messageformat

ICU MessageFormat correctness for pluralization, gender/select, and inline formatting. Reference files:
- `references/icu-syntax.md`: `plural`, `selectordinal`, `select`, `number`/`date`/`time`, nested arguments, and escaping rules.
- `references/pluralization-rules.md`: the CLDR plural categories and a language-to-categories table so you author exactly the branches each locale requires.

### catalog-hygiene

Keeping translation catalogs healthy and layouts RTL-ready. Reference files:
- `references/catalog-frameworks.md`: key/file conventions and extraction idioms for react-i18next, react-intl/FormatJS, vue-i18n, next-intl, i18next, and gettext, plus how to grep every call for cross-referencing.
- `references/rtl-logical-properties.md`: the full physical→logical CSS map and the RTL pitfalls (icons, transforms, shadows, background-position, bidi text).

## Hooks

A11y & i18n Remediator ships a **PostToolUse(Write|Edit)** hook that is **advisory and non-blocking**. When you edit a UI component file, `.jsx`, `.tsx`, `.vue`, `.svelte`, or `.html`: it injects a short reminder to run `/a11y-audit` on that file so accessibility regressions are caught while the change is fresh in your head.

The hook only surfaces a suggestion. It is fail-safe: it never blocks the edit, never rejects a tool call, and never fails the session. Disable it any time via the `/hooks` menu or by removing the plugin.

## Typical Workflow

1. You edit a React component. On save, the advisory hook reminds you to run `/a11y-audit` on it.
2. Run `/a11y-audit src/components/Checkout.tsx`. It reports an unlabeled icon button (4.1.2), a low-contrast token (1.4.3), and a modal with no focus trap (2.1.2), grouped by success criterion.
3. Run `/a11y-fix-focus src/components/Checkout.tsx`; the a11y-remediator agent traps focus, moves it in on open, restores it on close, and makes the background inert, each diff annotated with its WCAG SC. The unlabeled button and contrast token are fixed with the same agent, and any meaningful image is flagged for a human to describe.
4. Run `/i18n-extract src/features/checkout` to pull the hardcoded English into the catalog with stable keys and turn "3 items" into an ICU plural, leaving other locales empty for translators.
5. Run `/i18n-doctor locales` to confirm no key is missing or untranslated and that Polish and Arabic have their required plural categories.
6. Run `/rtl-ready src/styles` to rewrite physical CSS into logical properties and get the short list of icons and transforms that need a human's eyes before you ship Arabic.

## Plugin Structure

```
a11y-i18n-remediator/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── a11y-audit.md
│   ├── a11y-fix-focus.md
│   ├── i18n-extract.md
│   ├── i18n-doctor.md
│   └── rtl-ready.md
├── agents/
│   ├── a11y-remediator.md
│   └── i18n-extractor.md
├── skills/
│   ├── wcag-remediation/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── aria-patterns.md
│   │       └── focus-management.md
│   ├── icu-messageformat/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── icu-syntax.md
│   │       └── pluralization-rules.md
│   └── catalog-hygiene/
│       ├── SKILL.md
│       └── references/
│           ├── catalog-frameworks.md
│           └── rtl-logical-properties.md
└── README.md
```

## Requirements

- Claude Code CLI
- No browser, rendered DOM, or translation service, all analysis and remediation is static and diff-aware, and target locales are always left for a human translator.

## License

MIT

## Version

1.0.0

Fix the accessibility and localization work, don't just flag it.
