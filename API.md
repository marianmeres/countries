# API Reference

Complete API documentation for `@marianmeres/countries`.

The package exposes one zero-dependency core entry point plus opt-in subpaths.
Import only what you need — `./search` is the only entry that pulls in a
dependency, and locale / subdivision data modules are per-country and
code-split.

## Table of Contents

- [Core (`@marianmeres/countries`)](#core)
  - [Lookups](#lookups)
  - [Lookup maps](#lookup-maps)
  - [Flag helpers](#flag-helpers)
  - [i18n](#i18n)
- [Search (`@marianmeres/countries/search`)](#search)
- [Timezones (`@marianmeres/countries/timezones`)](#timezones)
- [Subdivisions (`@marianmeres/countries/subdivisions`)](#subdivisions)
- [Subdivision modules (`@marianmeres/countries/subdivisions/*`)](#subdivision-modules)
- [Locale modules (`@marianmeres/countries/locales/*`)](#locale-modules)
- [Types](#types)
- [Constants](#constants)

---

## Core

Imported from `@marianmeres/countries`. All lookups are synchronous and have no
dependencies.

### Lookups

#### `byIso(iso)`

Find a country by ISO 3166-1 alpha-2 code. Case-insensitive.

**Parameters:**

- `iso` (string) — alpha-2 code, e.g. `"SK"` or `"sk"`.

**Returns:** `Country | undefined` — `undefined` if the code is unknown.

```typescript
import { byIso } from "@marianmeres/countries";

byIso("sk");
// { iso: "SK", iso3: "SVK", numeric: "703", name: "Slovakia",
//   nativeName: "Slovensko", dialCode: "421", flag: "🇸🇰",
//   continent: "EU", currency: "EUR", capital: "Bratislava" }
```

---

#### `byIso3(iso3)`

Find a country by ISO 3166-1 alpha-3 code. Case-insensitive.

**Parameters:**

- `iso3` (string) — alpha-3 code, e.g. `"SVK"`.

**Returns:** `Country | undefined`

```typescript
byIso3("deu"); // Germany
```

---

#### `byNumeric(numeric)`

Find a country by ISO 3166-1 numeric code. Accepts a number or a string, with or
without zero-padding.

**Parameters:**

- `numeric` (string | number) — e.g. `"703"`, `4`, `"04"`.

**Returns:** `Country | undefined`

```typescript
byNumeric(4); // Afghanistan ("004")
byNumeric("703"); // Slovakia
```

---

#### `byDialCode(dialCode)`

Find all countries sharing a dial code. Multiple countries can share one (e.g.
`+1`). Pass with or without a leading `+`.

**Parameters:**

- `dialCode` (string | number) — e.g. `"1"`, `"+1"`, `1`, `"421"`.

**Returns:** `Country[]` — empty array for an unknown code.

```typescript
byDialCode("+1").map((c) => c.iso); // ["CA", "US"]
byDialCode("421"); // [Slovakia]
```

---

#### `byContinent(continent)`

All countries on a continent, in the canonical (English-name) order.

**Parameters:**

- `continent` ([ContinentCode](#continentcode)) — e.g. `"EU"`.

**Returns:** `Country[]`

```typescript
byContinent("EU").length; // 50
```

---

### Lookup maps

Prebuilt maps — handy primitives, e.g. for phone-number inputs. Built once at
module load.

#### `ISO_MAP`

`Map<string, Country>` — alpha-2 code → `Country`.

```typescript
ISO_MAP.get("SK"); // Country
```

#### `ISO3_MAP`

`Map<string, Country>` — alpha-3 code → `Country`.

#### `NUMERIC_MAP`

`Map<string, Country>` — zero-padded numeric code → `Country`.

#### `DIAL_CODE_MAP`

`Map<string, Country[]>` — dial code → countries sharing it.

```typescript
DIAL_CODE_MAP.get("1"); // Country[] sharing "+1"
```

#### `DIAL_CODES_DESC`

`string[]` — unique dial codes, sorted longest-first (then alphabetically). Use
for prefix detection during paste, so `+1684` (American Samoa) matches before
`+1`.

---

### Flag helpers

Pure functions computed from regional-indicator codepoints — no lookup table.

#### `isValidIso(iso)`

**Parameters:**

- `iso` (string)

**Returns:** `boolean` — `true` if `iso` is two ASCII letters (`/^[A-Za-z]{2}$/`).
Note: syntactic check only; does not verify the code is an assigned country.

```typescript
isValidIso("sk"); // true
isValidIso("s1"); // false
```

---

#### `isoToFlag(iso)`

Convert an alpha-2 code to its flag emoji.

**Parameters:**

- `iso` (string) — e.g. `"SK"`.

**Returns:** `string` — the flag emoji, or `""` for invalid input.

```typescript
isoToFlag("DE"); // "🇩🇪"
```

---

#### `flagToIso(flag)`

Inverse of `isoToFlag`.

**Parameters:**

- `flag` (string) — a flag emoji, e.g. `"🇸🇰"`.

**Returns:** `string` — the alpha-2 code, or `""` if `flag` is not a pair of
regional-indicator symbols. Does not validate that the code is an assigned country.

```typescript
flagToIso("🇸🇰"); // "SK"
```

---

### i18n

English is baked into `Country.name` and always available synchronously. Other
locales are separate, side-effect-free data modules loaded lazily and code-split.
A locale is just a `Record<iso, name>` ([LocaleNames](#localenames)) — there is
no translation engine.

#### `loadLocale(code)`

Load a locale's name map, resolving lazily.

**Parameters:**

- `code` (string) — locale code, e.g. `"sk"`. Case-insensitive.

**Returns:** `Promise<LocaleNames>`

- `"en"` resolves immediately to the canonical English names.
- A bundled locale (see [BUILTIN_LOCALES](#builtin_locales)) is dynamically
  imported, cached, and registered on first use.
- An already-registered custom locale is returned from the registry.
- Otherwise the promise rejects with an `Error`.

```typescript
import { COUNTRIES, loadLocale } from "@marianmeres/countries";

const sk = await loadLocale("sk");
COUNTRIES.map((c) => sk[c.iso] ?? c.name); // localized, English fallback
```

---

#### `registerLocale(code, names)`

Register (or replace) a locale's name map. Use for custom locales, or to
synchronously install a locale imported via `@marianmeres/countries/locales/<code>`.

**Parameters:**

- `code` (string) — locale code (stored lower-cased).
- `names` ([LocaleNames](#localenames)) — `iso → localized name`.

**Returns:** `void`

```typescript
registerLocale("fr", { SK: "Slovaquie", DE: "Allemagne" /* ... */ });
```

---

#### `getName(iso, locale?)`

Resolve a single country's display name in a locale, synchronously. Falls back to
the English name when the locale (or that entry) is unavailable.

**Parameters:**

- `iso` (string) — alpha-2 code. Case-insensitive.
- `locale` (string, optional) — locale code. Default: `"en"`.

**Returns:** `string | undefined` — `undefined` only when the ISO code itself is
unknown.

```typescript
import { getName, registerLocale } from "@marianmeres/countries";
import sk from "@marianmeres/countries/locales/sk";

registerLocale("sk", sk);
getName("DE", "sk"); // "Nemecko"
getName("DE"); // "Germany"
```

> `getName` only sees locales that are already registered/loaded synchronously.
> Call `loadLocale` (or `registerLocale`) first for non-English locales.

---

#### `hasLocale(code)`

**Parameters:**

- `code` (string)

**Returns:** `boolean` — whether the locale is currently available synchronously
(registered, or `"en"`).

---

#### `getRegisteredLocale(code)`

**Parameters:**

- `code` (string)

**Returns:** `LocaleNames | undefined` — the names if already loaded/registered
(`"en"` always available), else `undefined`.

---

## Search

Imported from `@marianmeres/countries/search`. Opt-in so the core stays
dependency-free — this is the only entry point that pulls in
[`@marianmeres/searchable`](https://jsr.io/@marianmeres/searchable). Matching is
case- and accent-insensitive.

#### `createCountrySearch(options?)`

Build a reusable country search index. Cheap to query; build once and reuse.
Indexes, per country: the (localized) display name, canonical English name, native
name, alpha-2, alpha-3, dial code, and aliases.

**Parameters:**

- `options` ([CountrySearchOptions](#countrysearchoptions), optional)
  - `options.names` ([LocaleNames](#localenames), optional) — localized display
    names to index. English is always indexed too. Default: English only.
  - `options.aliases` (`Record<string, string[]>`, optional) — extra terms per
    ISO. Merged with [COMMON_ALIASES](#common_aliases) unless `commonAliases` is
    `false`.
  - `options.commonAliases` (boolean, optional) — include the built-in aliases.
    Default: `true`.
  - `options.countries` ([Country](#country) `[]`, optional) — restrict the index
    to a subset. Default: all.
  - `options.strategy` ([SearchStrategy](#searchstrategy), optional) — default
    strategy used by `search`. Default: `"prefix"`.

**Returns:** [CountrySearch](#countrysearch)

```typescript
import { createCountrySearch } from "@marianmeres/countries/search";

const cs = createCountrySearch();
cs.search("germ"); // [Germany]        (prefix)
cs.search("deu"); // [Germany]        (alpha-3)
cs.search("germny", "fuzzy"); // [Germany]        (typo-tolerant)
cs.search("USA"); // [United States]  (alias)
```

Locale-aware and with custom aliases:

```typescript
import { loadLocale } from "@marianmeres/countries";

const sk = await loadLocale("sk");
const cs = createCountrySearch({ names: sk, aliases: { CH: ["Helvetia"] } });
cs.search("nemecko"); // [Germany]
cs.search("germ"); // [Germany] — English still works
```

---

#### `CountrySearch`

The built index.

```typescript
interface CountrySearch {
	search(query: string, strategy?: SearchStrategy, options?: SearchOptions): Country[];
	readonly index: Searchable; // escape hatch to the underlying searchable index
}
```

`search(query, strategy?, options?)`:

- `query` (string)
- `strategy` ([SearchStrategy](#searchstrategy), optional) — overrides the
  default set at build time.
- `options` ([SearchOptions](#searchoptions), optional) — `maxDistance`, `limit`,
  `offset`.

**Returns:** `Country[]` — matches, best match first, de-duplicated.

---

## Timezones

Imported from `@marianmeres/countries/timezones`. Opt-in. A point-in-time
snapshot of the IANA tz database (which changes a few times a year) — treat it as
a convenience, not an authority.

#### `timezonesOf(iso)`

**Parameters:**

- `iso` (string) — alpha-2 code. Case-insensitive.

**Returns:** `string[]` — IANA timezone identifiers, or `[]` if unknown.

```typescript
import { timezonesOf } from "@marianmeres/countries/timezones";

timezonesOf("SK"); // ["Europe/Prague"]
```

#### `TIMEZONES`

`Record<string, string[]>` — alpha-2 code → IANA identifiers (the underlying map).

---

## Subdivisions

Imported from `@marianmeres/countries/subdivisions`. Opt-in. ISO 3166-2
subdivision lists (states, provinces, territories, ...) keyed by ISO 3166-1
alpha-2 country code. Bundled countries:
[BUILTIN_SUBDIVISIONS](#builtin_subdivisions) (US, CA) — register your own for
anything else. A point-in-time snapshot of ISO 3166-2 — treat it as a
convenience, not an authority.

#### `loadSubdivisions(iso)`

Load a country's subdivision list, resolving lazily.

**Parameters:**

- `iso` (string) — ISO 3166-1 alpha-2 country code, e.g. `"US"`.
  Case-insensitive.

**Returns:** `Promise<Subdivision[]>`

- An already-registered list is returned from the registry.
- A bundled country (see [BUILTIN_SUBDIVISIONS](#builtin_subdivisions)) is
  dynamically imported, cached, and registered on first use.
- Otherwise resolves to `[]`. Unlike `loadLocale` it never rejects — having no
  subdivision list is the normal case for most countries.

```typescript
import { loadSubdivisions } from "@marianmeres/countries/subdivisions";

const us = await loadSubdivisions("US");
// [{ code: "AL", name: "Alabama", category: "state" }, ...]  (57 entries)
await loadSubdivisions("SK"); // [] — no bundled list
```

---

#### `registerSubdivisions(iso, subdivisions)`

Register (or replace) a country's subdivision list. Use for countries this
package does not bundle, to synchronously install a statically imported list,
or to override a bundled one.

**Parameters:**

- `iso` (string) — alpha-2 country code (stored upper-cased).
- `subdivisions` ([Subdivision](#subdivision) `[]`)

**Returns:** `void`

```typescript
registerSubdivisions("DE", [
	{ code: "BW", name: "Baden-Württemberg", category: "state" },
	{ code: "BY", name: "Bavaria", category: "state" },
	// ...
]);
```

---

#### `hasSubdivisions(iso)`

**Parameters:**

- `iso` (string)

**Returns:** `boolean` — whether a list is available for the country: bundled
(even if not loaded yet) or registered.

> Unlike `hasLocale`, this is not "available synchronously" — a bundled list
> still needs `loadSubdivisions` (or a static import + register) first.

---

#### `getRegisteredSubdivisions(iso)`

**Parameters:**

- `iso` (string)

**Returns:** `Subdivision[] | undefined` — the list if already
loaded/registered, else `undefined`.

---

## Subdivision modules

#### `@marianmeres/countries/subdivisions/us`, `.../subdivisions/ca`

Default export: a [Subdivision](#subdivision) `[]`, alphabetical by English
name. Static and tree-shakeable — import directly for a synchronous, statically
bundled list instead of `loadSubdivisions` (and optionally
`registerSubdivisions` it so the umbrella helpers see it).

- `us` — 57 entries: 50 × `"state"`, 1 × `"district"` (DC), 6 ×
  `"outlying area"` (AS, GU, MP, PR, UM, VI). USPS military "states" (AA/AE/AP)
  are not ISO subdivisions and are not included.
- `ca` — 13 entries: 10 × `"province"`, 3 × `"territory"` (NT, NU, YT).

```typescript
import US from "@marianmeres/countries/subdivisions/us";
import { registerSubdivisions } from "@marianmeres/countries/subdivisions";

registerSubdivisions("US", US);
US.filter((s) => s.category === "state").length; // 50
```

---

## Locale modules

#### `@marianmeres/countries/locales/sk`

Default export: a [LocaleNames](#localenames) map of Slovak country names. Static
and tree-shakeable — import it directly when you want a synchronous, statically
bundled locale instead of `loadLocale`.

```typescript
import sk from "@marianmeres/countries/locales/sk";
import { registerLocale } from "@marianmeres/countries";

registerLocale("sk", sk);
```

---

## Types

### `Country`

```typescript
interface Country {
	iso: string; // ISO 3166-1 alpha-2, "SK"          (unique)
	iso3: string; // ISO 3166-1 alpha-3, "SVK"         (unique)
	numeric: string; // ISO 3166-1 numeric, "703"         (unique, zero-padded)
	name: string; // canonical English name, "Slovakia"  (default display name)
	nativeName: string; // primary native name, "Slovensko"  (best-effort)
	dialCode: string; // without "+", "421"                (not unique, e.g. +1)
	flag: string; // "🇸🇰"
	continent: ContinentCode; // primary geographic continent
	currency: string; // primary ISO 4217 code, "EUR"      (best-effort)
	capital: string; // English capital, "Bratislava"     (may be "")
}
```

### `ContinentCode`

```typescript
type ContinentCode = "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";
```

`AF` Africa, `AN` Antarctica, `AS` Asia, `EU` Europe, `NA` North America,
`OC` Oceania, `SA` South America. Transcontinental countries are assigned their
primary (geographic) continent.

### `LocaleNames`

```typescript
type LocaleNames = Record<string, string>; // iso -> localized name
```

The entire shape of a locale: a plain object you index directly
(`names[iso] ?? country.name`).

### `Subdivision`

```typescript
interface Subdivision { // from ./subdivisions
	code: string; // ISO 3166-2 suffix, "MI"  (full code "US-MI"; = USPS/Canada Post abbr.)
	name: string; // canonical English name, "Michigan"
	category: string; // "state" | "district" | "outlying area" | "province" | "territory" | ...
}
```

`code` is unique within its country. `category` is an open string — ISO 3166-2
categories vary per country.

### `SearchStrategy`

```typescript
type SearchStrategy = "exact" | "prefix" | "fuzzy"; // from ./search
```

### `SearchOptions`

```typescript
interface SearchOptions { // from ./search
	maxDistance?: number; // max edit distance for fuzzy search
	limit?: number; // limit number of results
	offset?: number; // offset into results (pagination)
}
```

### `CountrySearchOptions`

See [`createCountrySearch`](#createcountrysearchoptions). From `./search`.

---

## Constants

### `COUNTRIES`

`Country[]` — all 234 countries/territories, alphabetical by English name.

### `CONTINENTS`

`Record<ContinentCode, string>` — human-readable English continent names.

```typescript
CONTINENTS.EU; // "Europe"
```

### `DEFAULT_LOCALE`

`"en"` — the default locale code. English names live on `Country.name`.

### `BUILTIN_LOCALES`

`readonly string[]` — locale codes bundled with the package: `["en", "sk"]`.

### `BUILTIN_SUBDIVISIONS`

`readonly string[]` (from `./subdivisions`) — country codes with a bundled
subdivision list: `["CA", "US"]`.

### `COMMON_ALIASES`

`Record<string, string[]>` (from `./search`) — a small, locale-independent set of
common alternative names / abbreviations, keyed by alpha-2 code (e.g.
`US: ["USA", "America", ...]`, `GB: ["UK", "Britain", ...]`). Override or extend
via `CountrySearchOptions.aliases`.

### `TIMEZONES`

`Record<string, string[]>` (from `./timezones`) — see [Timezones](#timezones).
