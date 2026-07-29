# AGENTS.md - Machine-Readable Package Documentation

## Package Overview

- **Name**: @marianmeres/countries
- **Version**: 1.0.1
- **License**: MIT
- **Runtime**: Deno (primary), Node.js (via NPM/JSR)
- **Language**: TypeScript
- **Type**: Library (country dataset + lookups)

## Purpose

Thin, dependency-free country dataset for:

- Direct lookups by ISO alpha-2 / alpha-3 / numeric / dial code / continent
- Phone/country input primitives (dial-code maps, longest-first prefix list)
- Flag emoji ⇄ ISO conversion (computed, no lookup table)
- Lazy, tree-shakeable i18n of country names (English baked in; others code-split)
- Opt-in fuzzy search (`/search`) and IANA timezones (`/timezones`)
- Opt-in ISO 3166-2 subdivisions (`/subdivisions`) — bundled: US, CA; per-country
  tree-shakeable data modules + lazy loader/registry for custom lists

Membership: **234** countries/territories, matching the canonical list used by the
`@marianmeres/stuic` phone/country inputs (asserted by `tests/coupling.test.ts`).

## Architecture

```
src/
├── mod.ts            # Main entry — re-exports countries + flag + locale
├── types.ts          # Shared types (Country, ContinentCode, LocaleNames, CONTINENTS)
├── countries.ts      # Core data re-export + sync lookups + prebuilt maps
├── flag.ts           # Pure flag-emoji helpers (no data table)
├── locale.ts         # i18n registry + lazy locale loading
├── search.ts         # Opt-in fuzzy search (./search) — only file pulling searchable
├── timezones.ts      # Opt-in IANA timezones (./timezones)
├── subdivisions.ts   # Opt-in ISO 3166-2 registry + lazy loaders (./subdivisions)
├── _data.ts          # GENERATED — COUNTRIES array (do not hand-edit)
├── _timezones.ts     # GENERATED — TIMEZONES map (do not hand-edit)
├── locales/
│   └── sk.ts         # GENERATED — Slovak names, default export (LocaleNames)
└── subdivisions/
    ├── ca.ts         # HAND-MAINTAINED — ISO 3166-2:CA, default export (Subdivision[])
    └── us.ts         # HAND-MAINTAINED — ISO 3166-2:US, default export (Subdivision[])

scripts/
├── _seed.ts          # HAND-EDITED source of truth (iso/name/dialCode/flag)
├── gen-data.ts       # Regenerates _data.ts, _timezones.ts, locales/*.ts
└── build-npm.ts      # NPM build — entryPoints must mirror deno.json exports
```

## Entry Points

| Subpath             | Module                   | Pulls in                  | Notes                              |
| ------------------- | ------------------------ | ------------------------- | ---------------------------------- |
| `.`                 | `src/mod.ts`             | nothing                   | Zero-dependency core               |
| `./search`          | `src/search.ts`          | `@marianmeres/searchable` | Opt-in fuzzy search                |
| `./timezones`       | `src/timezones.ts`       | nothing                   | Opt-in tz snapshot                 |
| `./subdivisions`    | `src/subdivisions.ts`    | nothing (data lazy)       | ISO 3166-2 registry + lazy loaders |
| `./subdivisions/us` | `src/subdivisions/us.ts` | nothing                   | Static US list (57 entries)        |
| `./subdivisions/ca` | `src/subdivisions/ca.ts` | nothing                   | Static CA list (13 entries)        |
| `./locales/sk`      | `src/locales/sk.ts`      | nothing                   | Static, tree-shakeable locale      |

## Public API

### Core (`.`)

```typescript
// Data
const COUNTRIES: Country[]; // all, alphabetical by English name
const CONTINENTS: Record<ContinentCode, string>;

// Prebuilt lookup maps
const ISO_MAP: Map<string, Country>; // alpha-2 -> Country
const ISO3_MAP: Map<string, Country>; // alpha-3 -> Country
const NUMERIC_MAP: Map<string, Country>; // numeric -> Country
const DIAL_CODE_MAP: Map<string, Country[]>; // dial code -> Country[] (shared, e.g. +1)
const DIAL_CODES_DESC: string[]; // unique dial codes, longest-first (paste detection)

// Lookups (synchronous, case-insensitive where sensible)
function byIso(iso: string): Country | undefined;
function byIso3(iso3: string): Country | undefined;
function byNumeric(numeric: string | number): Country | undefined; // "4" | 4 | "004"
function byDialCode(dialCode: string | number): Country[]; // "1" | "+1" | 1 -> []
function byContinent(continent: ContinentCode): Country[];

// Flag helpers (pure)
function isValidIso(iso: string): boolean; // /^[A-Za-z]{2}$/
function isoToFlag(iso: string): string; // "SK" -> "🇸🇰", "" if invalid
function flagToIso(flag: string): string; // "🇸🇰" -> "SK", "" if not a flag

// i18n
const DEFAULT_LOCALE: "en";
const BUILTIN_LOCALES: readonly string[]; // ["en", "sk"]
function loadLocale(code: string): Promise<LocaleNames>; // lazy; rejects unknown
function registerLocale(code: string, names: LocaleNames): void;
function hasLocale(code: string): boolean;
function getRegisteredLocale(code: string): LocaleNames | undefined;
function getName(iso: string, locale?: string): string | undefined; // English fallback
```

### Search (`./search`)

```typescript
function createCountrySearch(options?: CountrySearchOptions): CountrySearch;
const COMMON_ALIASES: Record<string, string[]>; // US:["USA",...], GB:["UK",...], ...

interface CountrySearch {
	search(query: string, strategy?: SearchStrategy, options?: SearchOptions): Country[];
	readonly index: Searchable; // escape hatch to underlying index
}

interface CountrySearchOptions {
	names?: LocaleNames; // localized display names to index (English always indexed)
	aliases?: Record<string, string[]>; // extra terms per ISO; merged with COMMON_ALIASES
	commonAliases?: boolean; // default: true
	countries?: Country[]; // restrict index subset; default: all
	strategy?: SearchStrategy; // default strategy; default: "prefix"
}

interface SearchOptions {
	maxDistance?: number;
	limit?: number;
	offset?: number;
}
type SearchStrategy = "exact" | "prefix" | "fuzzy";
```

Indexed per country: localized name, canonical English name, native name, alpha-2,
alpha-3, dial code, aliases. Case- and accent-insensitive. Build once, reuse.

### Timezones (`./timezones`)

```typescript
const TIMEZONES: Record<string, string[]>; // alpha-2 -> IANA ids
function timezonesOf(iso: string): string[]; // case-insensitive; [] if unknown
```

### Subdivisions (`./subdivisions`)

```typescript
const BUILTIN_SUBDIVISIONS: readonly string[]; // ["CA", "US"]
function loadSubdivisions(iso: string): Promise<Subdivision[]>; // lazy; [] if no list (never rejects)
function registerSubdivisions(iso: string, subdivisions: Subdivision[]): void; // custom/override
function hasSubdivisions(iso: string): boolean; // bundled (even unloaded) or registered
function getRegisteredSubdivisions(iso: string): Subdivision[] | undefined; // sync; undefined until loaded

// ./subdivisions/us, ./subdivisions/ca — default export: Subdivision[], alphabetical by name
// US: 57 = 50 "state" + 1 "district" (DC) + 6 "outlying area" (AS,GU,MP,PR,UM,VI); no USPS AA/AE/AP
// CA: 13 = 10 "province" + 3 "territory" (NT,NU,YT)
```

### Types

```typescript
type ContinentCode = "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";
type LocaleNames = Record<string, string>; // iso -> localized name

interface Subdivision {
	code: string; // ISO 3166-2 suffix, "MI" (full code "US-MI"; = USPS/Canada Post abbr.)
	name: string; // canonical English name, "Michigan"
	category: string; // open string: "state" | "district" | "outlying area" | "province" | "territory" | ...
}

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

## Critical Conventions

1. **Do not hand-edit generated files.** `src/_data.ts`, `src/_timezones.ts`, and
   `src/locales/*.ts` are produced by `scripts/gen-data.ts`. Edit the hand-curated
   `scripts/_seed.ts` (source of truth for `iso`/`name`/`dialCode`/`flag`), then
   regenerate with `deno task gen`. Output is deterministic (byte-identical on
   re-run) and committed.
2. **Keep the core dependency-free.** Only `src/search.ts` may import
   `@marianmeres/searchable`. Direct-lookup consumers must never bundle the index.
3. **Lazy loaders must use static string literals.** In `locale.ts`
   (`BUILTIN_LOCALE_LOADERS`) and `subdivisions.ts` (`BUILTIN_SUBDIVISION_LOADERS`),
   each value MUST be `() => import("./<dir>/<literal>.ts")`. A dynamic,
   template-literal `import()` of a computed path silently breaks the npm build
   and tree-shaking. (LOAD-BEARING — see the comments in both files.)
4. **Membership is coupled to `@marianmeres/stuic`.** `tests/coupling.test.ts`
   asserts the 234-entry list matches. Changing membership requires updating both.
5. **Flag helpers stay table-free.** `isoToFlag`/`flagToIso` are computed from
   regional-indicator codepoints; do not introduce a lookup table.
6. **Subdivision data is HAND-MAINTAINED, not generated.** `src/subdivisions/*.ts`
   are source-of-truth files (do NOT add them to `gen-data.ts`). Entries are
   alphabetical by English name; `code` is the ISO 3166-2 suffix (no country
   prefix). Integrity (counts, categories, order, uniqueness) is asserted by
   `tests/subdivisions.test.ts`. Bundled coverage is demand-driven (US, CA) —
   do not add a full-world ISO 3166-2 dump.

## Before Making Changes

- [ ] Editing country data? Change `scripts/_seed.ts`, then run `deno task gen`.
- [ ] Run `deno task test` (40 tests; includes the stuic coupling check).
- [ ] Adding a locale? Add the seed translations + regenerate, then register a
      static-literal loader in `locale.ts` and add the entry point in
      `deno.json` and `scripts/build-npm.ts`.
- [ ] Adding a subdivision country? Create `src/subdivisions/<iso>.ts`
      (default export `Subdivision[]`, alphabetical, ISO 3166-2 sourced),
      register a static-literal loader in `src/subdivisions.ts`, add the entry
      point in `deno.json` + `scripts/build-npm.ts`, extend
      `tests/subdivisions.test.ts`, and document it in README.md + API.md.
- [ ] Do not add dependencies to the core; keep `./search` the only consumer of searchable.

## Test Commands

```bash
deno task test         # All tests (--allow-read)
deno task test:watch   # Watch mode
```

## Build / Release Commands

```bash
deno task gen          # Regenerate data files from scripts/_seed.ts
deno task npm:build    # Build NPM package into .npm-dist/
deno task npm:publish  # Build + npm publish
deno publish           # Publish to JSR
deno task publish      # deno publish + npm publish
deno task rp           # Release patch + publish
deno task rpm          # Release minor + publish
```

## Dependencies

- `@marianmeres/searchable` — fuzzy search backend (`./search` entry point only)
- `@marianmeres/npmbuild` — NPM build tooling (build only)
- `@std/assert` — test assertions
- `@std/fs`, `@std/path` — file utilities (gen/build only)

Data is generated from permissively-licensed sources (`countries-list`,
`i18n-iso-countries`, `countries-and-timezones` — all MIT — plus the public-domain
IANA tz database), so the package stays MIT.

## Common Patterns

### Direct lookups

```typescript
import { byContinent, byDialCode, byIso, isoToFlag } from "@marianmeres/countries";
byIso("sk"); // Country | undefined
byDialCode("+1").map((c) => c.iso); // ["CA", "US"]
byContinent("EU").length; // 50
isoToFlag("DE"); // "🇩🇪"
```

### Lazy localized names

```typescript
import { COUNTRIES, loadLocale } from "@marianmeres/countries";
const sk = await loadLocale("sk");
COUNTRIES.map((c) => sk[c.iso] ?? c.name); // English fallback
```

### Static, tree-shakeable locale

```typescript
import sk from "@marianmeres/countries/locales/sk";
import { getName, registerLocale } from "@marianmeres/countries";
registerLocale("sk", sk);
getName("DE", "sk"); // "Nemecko"
```

### Fuzzy search (opt-in)

```typescript
import { createCountrySearch } from "@marianmeres/countries/search";
const cs = createCountrySearch();
cs.search("germny", "fuzzy"); // [Germany]
cs.search("USA"); // [United States]  (alias)
```

### Subdivisions (opt-in)

```typescript
import US from "@marianmeres/countries/subdivisions/us"; // static, tree-shakeable
import { loadSubdivisions } from "@marianmeres/countries/subdivisions";

US.filter((s) => s.category === "state"); // 50 states (skips DC + outlying areas)
await loadSubdivisions("CA"); // lazy: 13 provinces/territories
await loadSubdivisions("SK"); // [] — no bundled list (normal case, never rejects)
```

## Caveats (data quality)

- `nativeName` is best-effort (single primary language per country).
- `capital` is English-only and empty for a few territories (e.g. Macau).
- `currency` is the primary circulating ISO 4217 code (fund/unit codes like
  `CHE`/`CLF` filtered out).
- Non-standard codes (e.g. Kosovo `XK`) follow `i18n-iso-countries`.
- `./timezones` is a point-in-time IANA snapshot — a convenience, not an authority.
- `./subdivisions` is a point-in-time ISO 3166-2 snapshot; bundled coverage is
  demand-driven (US, CA only), and subdivision names are English
  (e.g. "Quebec", not "Québec").

## Documentation Index

- [README.md](./README.md) — human-facing overview and usage
- [API.md](./API.md) — complete API reference

## Version History

- **Unreleased** — Opt-in `./subdivisions` (ISO 3166-2): bundled US + CA as
  per-country static modules, plus lazy `loadSubdivisions` / registry mirroring
  the locale machinery.
- **1.0.0** — Initial release. Core lookups, prebuilt maps, flag helpers,
  lazy/tree-shakeable i18n (en + sk), opt-in `./search` and `./timezones`.
