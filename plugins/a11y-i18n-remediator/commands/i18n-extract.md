---
description: Extract hardcoded user-facing strings into the translation catalog and rewrite call sites idiomatically
argument-hint: [file-or-dir]
model: inherit
---

Find the hardcoded user-facing strings in the components at `$ARGUMENTS` (or the current diff), extract them into the project's translation catalog, and replace each literal with the framework's idiomatic translation call. This is the tedious, error-prone part of an i18n retrofit that CLIs do badly, deciding what is actually user-facing, generating stable keys, and preserving interpolation. This command dispatches the **i18n-extractor** agent and reads the `catalog-hygiene` skill's framework conventions.

## Process

### Step 1: Detect the i18n framework and catalog layout
Read the manifest and existing catalog to learn the conventions (see the skill's `references/catalog-frameworks.md`):

| Framework | Signal | Call idiom | Catalog |
|---|---|---|---|
| react-i18next | `i18next`, `useTranslation` | `t('key')`, `<Trans>` | `locales/<lng>/<ns>.json` |
| react-intl / FormatJS | `react-intl` | `intl.formatMessage`, `<FormattedMessage>` | extracted `.json` per locale |
| vue-i18n | `vue-i18n` | `$t('key')`, `t('key')` | `<lang>.json` / `messages` |
| next-intl | `next-intl` | `useTranslations`, `t('key')` | `messages/<locale>.json` |
| i18next (vanilla) | `i18next` | `i18next.t('key')` | `<lng>/translation.json` |
| Angular i18n | `@angular/localize`, `i18n=` | `i18n` attr / `$localize` | `messages.<locale>.xlf` |
| gettext | `.po`/`.pot`, `gettext`, `_()` | `_('text')`, `ngettext` | `<locale>/LC_MESSAGES/*.po` |

If no i18n library is present, report that and propose one for the stack rather than inventing calls.

### Step 2: Find hardcoded user-facing strings, and skip the rest
Scan JSX/template text nodes, `alt`/`title`/`aria-label`/`placeholder` attributes, and string literals passed to UI. **Extract** visible copy, button labels, headings, validation messages, and accessible-name attributes. **Skip** non-UI strings, object keys, enum values, URLs, routes, `className`/CSS, `data-testid`, `console.*`/logger messages, test fixtures, and code-only identifiers. When a string is ambiguous, mark it "review" rather than extracting blindly.

### Step 3: Extract via the i18n-extractor agent
Launch the **i18n-extractor** agent. For each string it: generates a stable, semantic key (namespaced by feature/component, not by English text); adds the source-locale value to the catalog; leaves other locales empty for human translators (**never** machine-translate); rewrites the call site with the framework idiom; and converts interpolation/pluralization to correct ICU (`{name}`, `{count, plural, one {# item} other {# items}}`) rather than string concatenation.

### Step 4: Report
Emit exactly these sections:
- `## Extracted Keys`: a table: `Key | Source value | file:line of original`.
- `## Catalog Additions`: the diff added to the source-locale file (and empty stubs for other locales).
- `## Code Changes`: the before/after diff at each call site.
- `## Left for Review`: ambiguous strings not extracted, and why.

## Important Notes
- Base extraction on real occurrences, cite each string's `file:line`; never invent copy that is not in the source.
- Never machine-translate: target-locale values stay empty (or the framework's "missing" sentinel) for a human translator.
- Preserve interpolation and plurals as ICU, never rebuild a sentence by concatenating translated fragments, which breaks in other grammars.
- Generate keys from meaning, not from the English string, so re-wording the copy does not churn the key.
