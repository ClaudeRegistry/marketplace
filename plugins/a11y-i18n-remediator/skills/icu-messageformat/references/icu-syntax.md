# ICU MessageFormat, Syntax Reference

ICU MessageFormat is the message grammar used by FormatJS/react-intl, react-i18next (with the ICU plugin), vue-i18n, next-intl, and MessageFormat.js. A message is text with `{...}` arguments. Get these forms right and a single string agrees grammatically in every language.

---

## Simple Argument

```
Hello, {name}!
```
The value is interpolated verbatim. Names are case-sensitive identifiers. Keep the whole sentence in one message, never `'Hello, ' + name + '!'`, because other languages reorder it.

---

## plural (cardinal numbers)

```
{count, plural,
  =0 {No items}
  one {# item}
  other {# items}}
```
- `#` prints `count` in the locale's number format (grouping separators included).
- `=N` matches that **exact** value and takes precedence over categories, use for special-cased `=0`/`=1` copy ("No messages", "One message").
- Keyword branches use the **CLDR plural categories**: `zero`, `one`, `two`, `few`, `many`, `other`. Author every category the *source* language needs; `other` is mandatory.
- `offset:N` subtracts before matching `#` and categories, for "You and N others":

```
{count, plural, offset:1
  =0 {No one liked this}
  =1 {{who} liked this}
  one {{who} and # other liked this}
  other {{who} and # others liked this}}
```
Here `#` shows `count - 1`.

---

## selectordinal (ranks: 1st, 2nd, 3rd)

```
{position, selectordinal,
  one {#st}
  two {#nd}
  few {#rd}
  other {#th}}
```
Uses **ordinal** plural rules, which differ from cardinal (English ordinals need `one`/`two`/`few`/`other`; English cardinals need only `one`/`other`). Do not reuse a `plural`'s categories for ordinals.

---

## select (enumerated choice / gender)

```
{gender, select,
  female {She replied}
  male {He replied}
  other {They replied}}
```
- Matches the argument against literal keywords. `other` is the **required** fallback, always include it (covers non-binary/unknown/missing).
- Use for grammatical gender, content type, status, any fixed set of variants. Do **not** use it as a poor man's plural; use `plural` for numbers so translators get their language's categories.

---

## number / date / time (inline formatting)

```
{price, number, currency}          {ratio, number, percent}
{when, date, medium}               {when, time, short}
{count, number, ::compact-short}   (skeleton form)
```
- Styles: `number` → `integer`/`currency`/`percent`; `date`/`time` → `short`/`medium`/`long`/`full`.
- `::skeleton` syntax (FormatJS/ICU4x) gives fine control: `::currency/EUR`, `::.00` (2 fraction digits), `::compact-short`. Currency itself is passed via formatter options, not hardcoded in the string.
- Prefer these over pre-formatting a number/date in JS, so each locale formats in its own convention (`1,234.5` vs `1.234,5` vs `١٬٢٣٤٫٥`).

---

## Nesting

Arguments compose. A `plural` branch may contain a `select`, `{name}`, or nested formatting:

```
{count, plural,
  one {{name} has # new message}
  other {{name} has # new messages}}
```
```
{gender, select,
  female {{count, plural, one {She sent # gift} other {She sent # gifts}}}
  other  {{count, plural, one {They sent # gift} other {They sent # gifts}}}}
```
Keep nesting shallow, two levels is a translator burden; three is a smell. Prefer restructuring the copy.

---

## Escaping

| To print | Write |
|---|---|
| literal `{` or `}` | wrap in single quotes: `'{'`, `'}'` |
| literal `#` inside a plural | `'#'` |
| literal apostrophe | `''` (two single quotes) |
| a run of literal syntax | `'{this is literal}'` |

Outside a quote, a lone `'` is a literal apostrophe; ICU's quote rules are the classic source of "why is my apostrophe eating the rest of the string." When copy contains an apostrophe next to a brace, double it: `''`.

---

## Common Mistakes → Fixes

| Mistake | Why it breaks | Fix |
|---|---|---|
| `count + ' items'` | untranslatable; no plural rules | `{count, plural, one {# item} other {# items}}` |
| `plural` with only `one`/`other` for all locales | Polish/Arabic/Russian need more categories | author per-locale categories (see pluralization-rules.md) |
| missing `other` branch | throws when no branch matches | always include `other` |
| `select` used for a number | translators lose their plural categories | use `plural` |
| pre-formatted number in JS | wrong grouping/decimal per locale | `{n, number}` inside the message |
| unescaped apostrophe near `{` | swallows following text | double it: `''` |
| translating sentence fragments | word order differs across languages | one message, one argument |

---

## Placeholder Consistency Across Locales
Every locale's translation of a key must use the **same argument set** as the source. If the source has `{name}` and `{count}`, a translation missing `{count}` will render `undefined` or throw. Cross-locale placeholder drift is a top runtime i18n bug, validate it in catalog audits.
