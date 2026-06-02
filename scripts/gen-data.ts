// deno-lint-ignore-file no-import-prefix
// (dev-only generator: pinned npm: specifiers are intentional for reproducibility)
/**
 * Data generator for `@marianmeres/countries`.
 *
 * Reads the canonical 234-entry seed (`_seed.ts`, authoritative for
 * iso/name/dialCode/flag) and merges in enrichment fields from
 * permissively-licensed sources, then emits the generated data modules:
 *
 *   - `src/_data.ts`        — the enriched `COUNTRIES` array
 *   - `src/locales/sk.ts`   — Slovak name map (`LocaleNames`)
 *   - `src/_timezones.ts`   — IANA timezones by ISO code
 *
 * Sources (all MIT / public-domain — deliberately avoiding ODbL datasets whose
 * share-alike would conflict with this package's MIT license):
 *
 *   - countries-list (MIT)         -> nativeName, continent, capital, currency
 *   - i18n-iso-countries (MIT)     -> iso3, numeric, localized names (en/sk/...)
 *   - countries-and-timezones (MIT)-> IANA timezones by alpha-2
 *
 * The merge may only ADD fields; it never overwrites a seed field (asserted).
 * Output is deterministic: running this twice produces byte-identical files,
 * so the generated files are committed and CI can re-run + diff to verify.
 *
 *   deno task gen
 */

import { SEED } from "./_seed.ts";
import type { ContinentCode, Country, LocaleNames } from "../src/types.ts";
import { CONTINENTS } from "../src/types.ts";

import { countries as COUNTRIES_LIST } from "npm:countries-list@3.1.1";
import i18n from "npm:i18n-iso-countries@7.14.0";
import enLang from "npm:i18n-iso-countries@7.14.0/langs/en.json" with { type: "json" };
import skLang from "npm:i18n-iso-countries@7.14.0/langs/sk.json" with { type: "json" };
import { getCountry as getTzCountry } from "npm:countries-and-timezones@3.7.2";

// deno-lint-ignore no-explicit-any
const CL = COUNTRIES_LIST as Record<string, any>;
// deno-lint-ignore no-explicit-any
i18n.registerLocale(enLang as any);
// deno-lint-ignore no-explicit-any
i18n.registerLocale(skLang as any);

/** Locales to emit as `src/locales/<code>.ts`. English stays baked into core. */
const EMIT_LOCALES = ["sk"] as const;

/**
 * ISO 4217 "fund" / unit-of-account codes that countries-list lists alongside
 * the real circulating currency (it orders them alphabetically, so `[0]` is
 * often one of these). We filter them out before picking the primary currency.
 */
const FUND_CURRENCY_CODES = new Set([
	"BOV",
	"CHE",
	"CHW",
	"CLF",
	"COU",
	"MXV",
	"USN",
	"USS",
	"UYI",
	"UYW",
	"XSU",
	"XUA",
	"CUC",
]);

/** Explicit primary-currency overrides for the few cases the heuristic gets wrong. */
const CURRENCY_OVERRIDE: Record<string, string> = {
	SV: "USD", // colón (SVC) is effectively defunct; USD is the circulating tender
	ZW: "USD", // multi-currency basket; USD is the practical primary
};

/** Geographic continent overrides (extension point; empty = trust countries-list). */
const CONTINENT_OVERRIDE: Record<string, ContinentCode> = {};

/** Capitals missing from / wrong in the source. */
const CAPITAL_OVERRIDE: Record<string, string> = {
	MO: "", // Macau (SAR) has no separate capital
};

/** Timezones missing from countries-and-timezones. */
const TIMEZONE_OVERRIDE: Record<string, string[]> = {
	XK: ["Europe/Belgrade"], // Kosovo shares Serbia's IANA zone
};

const VALID_CONTINENTS = new Set(Object.keys(CONTINENTS));

function pickCurrency(iso: string): string {
	if (CURRENCY_OVERRIDE[iso]) return CURRENCY_OVERRIDE[iso];
	const list: string[] = CL[iso]?.currency ?? [];
	const real = list.filter((c) => !FUND_CURRENCY_CODES.has(c));
	return real[0] ?? list[0] ?? "";
}

function fail(msg: string): never {
	console.error(`✗ gen-data: ${msg}`);
	Deno.exit(1);
}

// ---------------------------------------------------------------------------
// Build enriched countries
// ---------------------------------------------------------------------------

const COUNTRIES: Country[] = SEED.map((s) => {
	const cl = CL[s.iso];
	if (!cl) fail(`${s.iso} not found in countries-list`);

	const iso3 = i18n.alpha2ToAlpha3(s.iso);
	const numericRaw = i18n.alpha2ToNumeric(s.iso);
	if (!iso3) fail(`${s.iso} has no alpha-3`);
	if (!numericRaw) fail(`${s.iso} has no numeric code`);
	const numeric = String(numericRaw).padStart(3, "0");

	const continent = (CONTINENT_OVERRIDE[s.iso] ?? cl.continent) as ContinentCode;
	const capital = CAPITAL_OVERRIDE[s.iso] ?? cl.capital ?? "";
	const nativeName = cl.native ?? s.name;

	return {
		iso: s.iso,
		iso3,
		numeric,
		name: s.name, // seed authoritative — never overwritten
		nativeName,
		dialCode: s.dialCode, // seed authoritative
		flag: s.flag, // seed authoritative
		continent,
		currency: pickCurrency(s.iso),
		capital,
	};
});

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

const seenIso = new Set<string>();
const seenIso3 = new Set<string>();
const seenNumeric = new Set<string>();
for (const c of COUNTRIES) {
	if (!/^[A-Z]{2}$/.test(c.iso)) fail(`bad iso: ${c.iso}`);
	if (!/^[A-Z]{3}$/.test(c.iso3)) fail(`bad iso3 for ${c.iso}: ${c.iso3}`);
	if (!/^\d{3}$/.test(c.numeric)) fail(`bad numeric for ${c.iso}: ${c.numeric}`);
	if (!/^\d+$/.test(c.dialCode)) fail(`bad dialCode for ${c.iso}: ${c.dialCode}`);
	if (!VALID_CONTINENTS.has(c.continent)) {
		fail(`bad continent for ${c.iso}: ${c.continent}`);
	}
	if (!/^[A-Z]{3}$/.test(c.currency)) fail(`bad currency for ${c.iso}: ${c.currency}`);
	if (typeof c.capital !== "string") fail(`bad capital for ${c.iso}`);
	if (!c.nativeName) fail(`empty nativeName for ${c.iso}`);
	if ([...c.flag].length === 0) fail(`empty flag for ${c.iso}`);
	if (seenIso.has(c.iso)) fail(`duplicate iso: ${c.iso}`);
	if (seenIso3.has(c.iso3)) fail(`duplicate iso3: ${c.iso3}`);
	if (seenNumeric.has(c.numeric)) fail(`duplicate numeric: ${c.numeric}`);
	seenIso.add(c.iso);
	seenIso3.add(c.iso3);
	seenNumeric.add(c.numeric);
}

// Locales — must cover every iso
const locales: Record<string, LocaleNames> = {};
for (const code of EMIT_LOCALES) {
	const names: LocaleNames = {};
	for (const c of COUNTRIES) {
		const n = i18n.getName(c.iso, code);
		if (!n) fail(`locale ${code} missing name for ${c.iso}`);
		names[c.iso] = n;
	}
	locales[code] = names;
}

// Timezones — must cover every iso
const timezones: Record<string, string[]> = {};
for (const c of COUNTRIES) {
	const tz = TIMEZONE_OVERRIDE[c.iso] ?? getTzCountry(c.iso)?.timezones ?? [];
	if (!tz.length) fail(`no timezones for ${c.iso}`);
	timezones[c.iso] = [...tz];
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const HEADER =
	`// AUTO-GENERATED by scripts/gen-data.ts — do not edit by hand.\n// Run \`deno task gen\` to regenerate. Source of truth: scripts/_seed.ts\n`;

const q = (s: string) => JSON.stringify(s);

function emitData(): string {
	const lines = COUNTRIES.map((c) =>
		`\t{ iso: ${q(c.iso)}, iso3: ${q(c.iso3)}, numeric: ${q(c.numeric)}, name: ${
			q(c.name)
		}, nativeName: ${q(c.nativeName)}, dialCode: ${q(c.dialCode)}, flag: ${
			q(c.flag)
		}, continent: ${q(c.continent)}, currency: ${q(c.currency)}, capital: ${
			q(c.capital)
		} },`
	);
	return `${HEADER}\nimport type { Country } from "./types.ts";\n\n` +
		`/** All ${COUNTRIES.length} countries, in alphabetical order by English name. */\n` +
		`// deno-fmt-ignore\nexport const COUNTRIES: Country[] = [\n${
			lines.join("\n")
		}\n];\n`;
}

function emitLocale(code: string, names: LocaleNames): string {
	const keys = Object.keys(names).sort();
	const lines = keys.map((k) => `\t${q(k)}: ${q(names[k])},`);
	return `${HEADER}\nimport type { LocaleNames } from "../types.ts";\n\n` +
		`/** Country names in "${code}". Side-effect-free data module (tree-shakeable). */\n` +
		`const ${code}: LocaleNames = {\n${
			lines.join("\n")
		}\n};\n\nexport default ${code};\n`;
}

function emitTimezones(): string {
	const keys = Object.keys(timezones).sort();
	const lines = keys.map((k) => `\t${q(k)}: [${timezones[k].map(q).join(", ")}],`);
	return `${HEADER}\n/** IANA timezone identifiers by ISO 3166-1 alpha-2 code. */\n` +
		`// deno-fmt-ignore\nexport const TIMEZONES: Record<string, string[]> = {\n${
			lines.join("\n")
		}\n};\n`;
}

const root = new URL("../", import.meta.url);
const write = (rel: string, content: string) => {
	const path = new URL(rel, root);
	Deno.mkdirSync(new URL(".", path), { recursive: true });
	Deno.writeTextFileSync(path, content);
	console.log(`  wrote ${rel}`);
};

write("src/_data.ts", emitData());
write("src/_timezones.ts", emitTimezones());
for (const code of EMIT_LOCALES) {
	write(`src/locales/${code}.ts`, emitLocale(code, locales[code]));
}

// Format emitted files so they match `deno fmt --check`.
const fmt = new Deno.Command("deno", {
	args: ["fmt", "src/_data.ts", "src/_timezones.ts", "src/locales"],
	cwd: new URL("../", import.meta.url),
}).outputSync();
if (!fmt.success) fail("deno fmt failed on generated files");

console.log(
	`✓ generated ${COUNTRIES.length} countries, locales=[${EMIT_LOCALES.join(",")}]`,
);
