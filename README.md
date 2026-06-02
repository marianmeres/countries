# @marianmeres/countries

[![NPM version](https://img.shields.io/npm/v/@marianmeres/countries.svg)](https://www.npmjs.com/package/@marianmeres/countries)
[![JSR version](https://jsr.io/badges/@marianmeres/countries)](https://jsr.io/@marianmeres/countries)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A thin, dependency-free country dataset for Deno and Node: ISO codes, dial codes,
flags, continents, currencies, capitals and native names — with lazy,
tree-shakeable **en/sk i18n** (English by default) and optional fuzzy **search**.

- **Zero-dependency core.** Direct lookups by alpha-2 / alpha-3 / numeric / dial
  code / continent. Nothing else is bundled unless you import it.
- **Lazy, tree-shakeable locales.** English is baked in and synchronous; other
  locales load on demand as their own code-split chunk. Extensible with your own.
- **Opt-in fuzzy search** (`/search`) built on
  [`@marianmeres/searchable`](https://jsr.io/@marianmeres/searchable) — typo- and
  accent-tolerant, with custom aliases.
- **Opt-in IANA timezones** (`/timezones`).

## Install

```sh
# Deno
deno add jsr:@marianmeres/countries

# npm / pnpm / yarn / bun (via JSR)
npx jsr add @marianmeres/countries
```

```ts
import { byContinent, byDialCode, byIso, loadLocale } from "@marianmeres/countries";
```

## Quick start

```ts
import { byContinent, byDialCode, byIso, isoToFlag } from "@marianmeres/countries";

byIso("sk");
// { iso: "SK", iso3: "SVK", numeric: "703", name: "Slovakia",
//   nativeName: "Slovensko", dialCode: "421", flag: "🇸🇰",
//   continent: "EU", currency: "EUR", capital: "Bratislava" }

byDialCode("+1").map((c) => c.iso); // ["CA", "US"]
byContinent("EU").length; // 50
isoToFlag("DE"); // "🇩🇪"
```

## Core API

For the complete per-export reference (parameters, return types, every entry
point), see [API.md](API.md). The sections below cover the common usage.

### The `Country` shape

```ts
interface Country {
	iso: string; // ISO 3166-1 alpha-2, "SK"        (unique)
	iso3: string; // ISO 3166-1 alpha-3, "SVK"       (unique)
	numeric: string; // ISO 3166-1 numeric, "703"       (unique, zero-padded)
	name: string; // canonical English name, "Slovakia"
	nativeName: string; // primary native name, "Slovensko"
	dialCode: string; // without "+", "421"              (not unique, e.g. +1)
	flag: string; // "🇸🇰"
	continent: ContinentCode; // "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA"
	currency: string; // primary ISO 4217 code, "EUR"
	capital: string; // English capital, "Bratislava"  (may be "")
}
```

### Lookups

All lookups are synchronous and case-insensitive where it makes sense.

```ts
import {
	byContinent, // (cont)     => Country[]
	byDialCode, // (code)     => Country[]             ("1" | "+1")
	byIso, // (iso)      => Country | undefined
	byIso3, // (iso3)     => Country | undefined
	byNumeric, // (n)        => Country | undefined   ("4" | 4 | "004")
	CONTINENTS, // Record<ContinentCode, string>
	COUNTRIES, // Country[] — all, alphabetical by English name
} from "@marianmeres/countries";
```

Pre-built maps (handy primitives, e.g. for phone-number inputs):

```ts
import {
	DIAL_CODE_MAP,
	DIAL_CODES_DESC,
	ISO3_MAP,
	ISO_MAP,
	NUMERIC_MAP,
} from "@marianmeres/countries";

ISO_MAP.get("SK"); // Country
DIAL_CODE_MAP.get("1"); // Country[] sharing "+1"
DIAL_CODES_DESC; // unique dial codes, longest-first (for paste prefix detection)
```

### Flag helpers

```ts
import { flagToIso, isoToFlag, isValidIso } from "@marianmeres/countries";

isoToFlag("SK"); // "🇸🇰"  (computed from regional-indicator codepoints)
flagToIso("🇸🇰"); // "SK"
isValidIso("sk"); // true
```

## i18n

English is the default and always available with zero setup. Other locales are
separate data modules that load lazily — **you only pay for the locales you use.**

```ts
import { COUNTRIES, loadLocale } from "@marianmeres/countries";

const sk = await loadLocale("sk"); // lazy: fetched only on demand
COUNTRIES.map((c) => sk[c.iso] ?? c.name); // localized, with English fallback
```

`loadLocale` returns a plain `Record<iso, name>` — there is no translation engine,
just data you index directly.

Prefer a synchronous, statically tree-shaken import? Import the locale module
directly and register it:

```ts
import sk from "@marianmeres/countries/locales/sk"; // static, tree-shakeable
import { getName, registerLocale } from "@marianmeres/countries";

registerLocale("sk", sk);
getName("DE", "sk"); // "Nemecko"  (falls back to English if missing)
```

Built-in locales: **en** (default), **sk**. Add your own with `registerLocale`:

```ts
registerLocale("fr", { SK: "Slovaquie", DE: "Allemagne" /* ... */ });
```

Helpers: `getName(iso, locale?)`, `hasLocale(code)`, `getRegisteredLocale(code)`,
`BUILTIN_LOCALES`.

## Search — `@marianmeres/countries/search`

Fuzzy "any match" search, opt-in so the core stays dependency-free. Built on
`@marianmeres/searchable` (case- and accent-insensitive).

```ts
import { createCountrySearch } from "@marianmeres/countries/search";

const cs = createCountrySearch();
cs.search("germ"); // [Germany]        (prefix)
cs.search("deu"); // [Germany]        (alpha-3)
cs.search("germny", "fuzzy"); // [Germany]        (typo-tolerant)
cs.search("USA"); // [United States]  (alias)
```

It indexes, per country: the (localized) display name, the canonical English
name, native name, alpha-2, alpha-3, dial code, and aliases. Build it once and
reuse it.

Locale-aware — pass in a loaded locale's names:

```ts
import { loadLocale } from "@marianmeres/countries";

const sk = await loadLocale("sk");
const cs = createCountrySearch({ names: sk });
cs.search("nemecko"); // [Germany]
cs.search("germ"); // [Germany] — English still works too
```

Custom aliases (merged with the built-in `COMMON_ALIASES` unless
`commonAliases: false`):

```ts
createCountrySearch({ aliases: { CH: ["Helvetia"] } });
```

Options: `{ names?, aliases?, commonAliases?, countries?, strategy? }`.
`search(query, strategy?, { maxDistance?, limit?, offset? })` where `strategy` is
`"prefix"` (default), `"fuzzy"`, or `"exact"`.

## Timezones — `@marianmeres/countries/timezones`

```ts
import { TIMEZONES, timezonesOf } from "@marianmeres/countries/timezones";

timezonesOf("SK"); // ["Europe/Prague"]
```

Opt-in (kept out of the core). Note: a point-in-time snapshot of the IANA tz
database — treat it as a convenience, not an authority.

## Data & licensing

The list of 234 countries (authoritative for `iso` / `name` / `dialCode` /
`flag`) is hand-curated. Enrichment fields are generated by
[`scripts/gen-data.ts`](scripts/gen-data.ts) from permissively-licensed sources
(`countries-list`, `i18n-iso-countries`, `countries-and-timezones` — all MIT —
plus the public-domain IANA tz database), so this package can stay MIT.

Caveats:

- `nativeName` is best-effort (a single primary language per country).
- `capital` is English-only and empty for a few territories (e.g. Macau).
- `currency` is the primary circulating ISO 4217 code (fund/unit-of-account codes
  such as `CHE`/`CLF` are filtered out).
- Codes for non-standard entries (e.g. Kosovo `XK`) follow `i18n-iso-countries`.

Regenerate after editing [`scripts/_seed.ts`](scripts/_seed.ts):

```sh
deno task gen   # rewrites src/_data.ts, src/_timezones.ts, src/locales/*.ts
```

Output is deterministic (re-running produces byte-identical files), so the
generated files are committed.

## License

MIT
