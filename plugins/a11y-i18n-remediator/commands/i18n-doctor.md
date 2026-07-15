---
description: Audit translation catalogs for missing/unused/untranslated keys and ICU errors, and emit a health report
argument-hint: [locale-dir]
model: inherit
---

Audit the translation catalogs in `$ARGUMENTS` (or the project's detected locale directory) for the correctness and completeness problems that silently ship broken UI in non-default languages. This is a **static** audit, it cross-references the catalog files against the keys used in code. Load the `catalog-hygiene` skill for framework conventions and the `icu-messageformat` skill for ICU/plural validation.

## Process

### Step 1: Locate the catalogs and the source locale
Find the locale files and identify the **source** locale (usually `en`), the reference every other locale is measured against. Detect the format from the layout (`locales/<lng>/<ns>.json`, `messages/<locale>.json`, `messages.<locale>.xlf`, `<locale>/LC_MESSAGES/*.po`) and how keys map to code calls (see `references/catalog-frameworks.md`).

### Step 2: Cross-reference code against catalogs
Grep the codebase for translation calls (`t('...')`, `formatMessage({ id: '...' })`, `$t('...')`, `_('...')`, `i18n=` ids) and diff the key set against each catalog:

| Check | How to find it | Impact |
|---|---|---|
| Missing keys | Key used in code, absent in a locale | Runtime fallback or raw key shown to users |
| Unused keys | Key in catalog, referenced nowhere | Dead weight; translators paid to translate cruft |
| Untranslated values | Target value byte-equal to the source locale | Looks translated, ships English |
| Placeholder drift | `{name}`/`{count}` set differs across locales for one key | `undefined` in the string, or a thrown formatter error |
| ICU syntax errors | Unbalanced `{}`, bad `plural`/`select` clause, unknown type | Formatter throws or renders literally at runtime |
| Missing plural categories | Locale lacks a CLDR category its grammar requires (e.g. Polish `few`/`many`, Arabic `zero`/`two`) | Wrong number agreement for real inputs |

### Step 3: Validate ICU per locale
For every message with `plural`/`selectordinal`/`select`, parse the ICU (see the `icu-messageformat` skill) and confirm: the argument set matches the source, every branch is well-formed, and the locale supplies exactly the CLDR plural categories its language needs, not a copy of English's `one`/`other` (see `references/pluralization-rules.md`).

### Step 4: Report
Emit exactly these sections:
- `## Catalog Health by Locale`: one row per locale: `Locale | Keys | Missing | Untranslated | ICU errors | Coverage %`.
- `## Findings`: grouped by check, each with the key, the offending locale(s), and the exact file (and line, for text formats).
- `## Fix List`: ordered actions: keys to add, keys to remove, ICU to correct, plural categories to complete. Mark which are mechanical vs which need a translator.

## Important Notes
- Base every finding on the real catalog and real code references, cite the file (and line where the format has them); never fabricate a key or a coverage number.
- "Untranslated" via value-equality has false positives (proper nouns, brand names, shared tokens like "OK"), flag, do not auto-delete.
- Never machine-translate a missing value; list it for a human translator.
- A missing plural category is a correctness bug, not a warning: numbers will agree wrongly for inputs that hit that category.
