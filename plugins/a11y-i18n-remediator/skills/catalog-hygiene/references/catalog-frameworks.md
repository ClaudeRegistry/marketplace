# i18n Framework Conventions

Per-framework: how to detect it, where catalogs live, the call idiom to rewrite to, how to grep for every translation call (to cross-reference for missing/unused keys), and the extraction gotchas. Detect the framework from the manifest and an existing catalog before extracting or auditing.

---

## react-i18next

- **Detect:** `i18next`, `react-i18next` in `package.json`; `useTranslation`, `initReactI18next`.
- **Catalog:** `public/locales/<lng>/<namespace>.json` (or `src/locales/...`), nested or flat keys.
- **Call idioms:**
  - text: `const { t } = useTranslation('ns'); t('checkout.total_label')`
  - interpolation: `t('greeting', { name })` with catalog `"greeting": "Hello, {{name}}"` (i18next uses `{{ }}`; enable the ICU plugin for `{name}`/`plural`).
  - embedded markup: `<Trans i18nKey="terms">Accept the <a>terms</a></Trans>`.
- **Find calls (grep):** `t\(\s*['"\`]`, `i18nKey=`, `useTranslation\(`.
- **Plurals:** i18next-native uses `key_one`/`key_other` suffix keys; with the ICU plugin, use standard ICU inside the value. Be consistent per project.
- **Gotcha:** namespaces, a bare `t('x')` resolves in the default namespace; a missing namespace looks like a missing key.

---

## react-intl / FormatJS

- **Detect:** `react-intl` / `@formatjs/*`; `IntlProvider`, `defineMessages`.
- **Catalog:** source strings live inline in `defaultMessage` (ICU); extracted to per-locale JSON via `formatjs extract` keyed by `id`.
- **Call idioms:**
  - `intl.formatMessage({ id: 'checkout.total', defaultMessage: '{count, plural, one {# item} other {# items}}' }, { count })`
  - `<FormattedMessage id="..." defaultMessage="..." values={{ count }} />`
- **Find calls (grep):** `formatMessage\(`, `<FormattedMessage`, `defineMessages\(`.
- **Plurals:** native ICU in `defaultMessage`: this is the reference ICU implementation.
- **Gotcha:** the `id` is the catalog key; if `id` is auto-generated from the message, editing the copy churns the key, prefer explicit stable `id`s.

---

## vue-i18n

- **Detect:** `vue-i18n`; `createI18n`, `$t`/`useI18n`.
- **Catalog:** `<lang>.json` message objects, or `<i18n>` blocks in SFCs.
- **Call idioms:** `{{ $t('checkout.total_label') }}`; `t('greeting', { name })`; Composition API `const { t } = useI18n()`.
- **Find calls (grep):** `\$t\(`, `[^a-z]t\(`, `<i18n`, `useI18n\(`.
- **Plurals:** legacy pipe syntax `"car | cars"` with `$tc`/`t(key, n)`, OR full ICU via `@intlify/...`: do not mix the two forms in one message.
- **Gotcha:** `$tc` vs `$t` for pluralization in Vue 2; Vue 3 unifies on `t(key, n)`.

---

## next-intl

- **Detect:** `next-intl`; `NextIntlClientProvider`, `useTranslations`, `getTranslations`.
- **Catalog:** `messages/<locale>.json`, nested by namespace.
- **Call idioms:** client `const t = useTranslations('Checkout'); t('total', { count })`; server `const t = await getTranslations('Checkout')`.
- **Find calls (grep):** `useTranslations\(`, `getTranslations\(`, `\bt\(`.
- **Plurals:** ICU in the message value.
- **Gotcha:** server vs client hook, a `useTranslations` in a Server Component or `getTranslations` in a Client Component is a runtime error, not a catalog issue.

---

## i18next (vanilla / non-React)

- **Detect:** `i18next` without a UI binding.
- **Catalog:** `<lng>/translation.json`.
- **Call idioms:** `i18next.t('key', { name })`.
- **Find calls (grep):** `i18next\.t\(`, `\.t\(`.
- **Gotcha:** same `{{ }}` interpolation and suffix-plural rules as react-i18next.

---

## Angular i18n (@angular/localize)

- **Detect:** `@angular/localize`; `i18n` attributes in templates; `$localize` in code.
- **Catalog:** extracted to `messages.xlf` / `messages.<locale>.xlf` (XLIFF) or `.xtb` via `ng extract-i18n`.
- **Call idioms:** template `<h1 i18n="site header|The main heading@@homeTitle">Welcome</h1>`; code `` $localize`:@@id:Welcome` ``.
- **Find calls (grep):** `i18n=`, `i18n-`, `\$localize`.
- **Plurals/select:** ICU directly in the template: `{count, plural, =0 {…} other {…}}`.
- **Gotcha:** the `@@id` is the stable key; without it Angular hashes the source text, so a copy edit changes the id. Keys live in the XLIFF `<trans-unit id>`.

---

## gettext (.po / .pot)

- **Detect:** `.po`/`.pot` files; `gettext`, `_()`, `ngettext`, `xgettext`.
- **Catalog:** `<locale>/LC_MESSAGES/domain.po` compiled to `.mo`; template `domain.pot`.
- **Call idioms:** `_('Save changes')` / `gettext('Save changes')`; plural `ngettext('%d file', '%d files', n)`; context `pgettext('menu', 'File')`.
- **Find calls (grep):** `\b_\(`, `gettext\(`, `ngettext\(`, `pgettext\(`.
- **Key model:** the **msgid is the source English string itself**: there is no separate key. A copy edit changes the msgid and orphans the old translations (they become `#~` obsolete entries). Plurals use `msgid_plural` + indexed `msgstr[0..n]` with a `Plural-Forms:` header per locale.
- **Gotcha:** `Plural-Forms` header must match the language's CLDR categories; a wrong `nplurals`/`plural=` expression breaks agreement.

---

## Cross-Referencing For Catalog Audits
1. **Collect used keys:** grep the call idioms above across the codebase → the set of keys/ids/msgids actually referenced.
2. **Collect catalog keys:** parse each locale file → its key set.
3. **Missing** = used − present(locale). **Unused** = present(source) − used. **Untranslated** = value equals source value.
4. For gettext, "used" keys are the msgids in the `.pot`; compare each `.po` against it.
5. Report per-locale coverage = translated ÷ source keys. Never machine-fill a gap, list it for a translator.

## Key-Naming Guidance (all frameworks)
- Namespace by feature/component: `checkout.summary.total_label`, not `total` or `Total amount:`.
- Derive from **meaning**, not the English words, so re-wording copy does not churn keys (except gettext, where the msgid *is* the source, accept that trade-off or move to keyed messages).
- One canonical key per concept; reuse before duplicating.
