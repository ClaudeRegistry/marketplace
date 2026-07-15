# CLDR Pluralization Rules

The number of plural forms a language needs is defined by the Unicode CLDR, not by English intuition. Authoring the wrong set produces wrong grammatical agreement for real inputs. This is the reference for *which* categories each language requires so your ICU `plural` messages are complete.

---

## The Six Cardinal Categories

CLDR defines up to six cardinal plural categories. A language uses a **subset**:

| Category | Meaning (varies by language) |
|---|---|
| `zero` | special form for 0 (e.g. Arabic, Latvian) |
| `one` | singular / "one-like" quantities |
| `two` | dual (e.g. Arabic, Welsh, Slovenian) |
| `few` | small-number form (e.g. Polish 2–4, Czech 2–4) |
| `many` | large-number / fractional form (e.g. Polish, Russian, Arabic) |
| `other` | the required catch-all (the ONLY form some languages need) |

`other` is always present and is the mandatory fallback in every `plural` block. `#` renders the count in the locale's numerals and grouping.

---

## Cardinal Categories By Language

| Language(s) | Required cardinal categories |
|---|---|
| Japanese, Chinese, Korean, Thai, Vietnamese, Indonesian, Turkish (cardinals) | `other` only |
| English, German, Dutch, Spanish, Italian, Portuguese, Swedish, Danish, Norwegian, Greek, Hebrew (modern) | `one`, `other` |
| French, Brazilian Portuguese | `one`, `many`, `other` (French: `one` covers 0 and 1) |
| Czech, Slovak | `one`, `few`, `many`, `other` |
| Polish | `one`, `few`, `many`, `other` |
| Russian, Ukrainian, Serbian, Croatian, Bosnian | `one`, `few`, `many`, `other` |
| Lithuanian | `one`, `few`, `many`, `other` |
| Slovenian | `one`, `two`, `few`, `other` |
| Irish (Gaeilge) | `one`, `two`, `few`, `many`, `other` |
| Welsh | `zero`, `one`, `two`, `few`, `many`, `other` (all six) |
| Arabic | `zero`, `one`, `two`, `few`, `many`, `other` (all six) |
| Latvian | `zero`, `one`, `other` |

> These are the categories the language *distinguishes*; a message that omits one will fall through to `other` and read wrongly for the inputs that category covers. When unsure, consult the CLDR plural-rules chart for the exact numeric ranges, do not guess.

---

## Why "one" Is Not "== 1"

`one` is a *category*, not the literal number 1. Examples:
- **Russian:** `one` matches 1, 21, 31, 101 … (n mod 10 == 1 and n mod 100 != 11); `few` matches 2–4, 22–24 …; `many` matches 0, 5–20, 25–30 …
- **French:** `one` matches 0 **and** 1 ("0 point", "1 point" both singular-ish).
- **Polish:** `few` matches 2–4 (but not 12–14); 12–14 are `many`.

This is exactly why you cannot hand-roll `count === 1 ? singular : plural` and why splitting a sentence to concatenate a count is a bug. Let the ICU runtime pick the category from CLDR.

---

## Ordinals Are Different (selectordinal)

Ordinal categories (1st, 2nd, 3rd) follow a **separate** CLDR table:

| Language | Ordinal categories |
|---|---|
| English | `one` (1st/21st), `two` (2nd/22nd), `few` (3rd/23rd), `other` (4th…, 11th–13th) |
| Many languages | `other` only (no distinct ordinal suffixes) |
| Welsh | up to six ordinal categories |

Never reuse a language's cardinal categories for `selectordinal`: English cardinals need only `one`/`other`, but English ordinals need `one`/`two`/`few`/`other`.

---

## Auditing Checklist For A Catalog
1. For each `plural`/`selectordinal` message, list the categories present in each locale.
2. Compare against the language's required set from the tables above.
3. **Missing category** → flag as a correctness bug (wrong agreement for inputs that hit it).
4. **Extra category** the language does not use (e.g. a `few` in German) → harmless but dead; note it.
5. Confirm the **source** locale authored every category *it* needs before you fault translations for missing ones.
6. Confirm every branch, in every locale, uses the same argument names as the source (no placeholder drift).

Never fabricate a translation to fill a missing category, flag it for a translator who knows the target grammar. The plugin's job is to detect the gap and prescribe the correct category set, not to invent target-language text.
