/**
 * Core country data + direct (synchronous, zero-dependency) lookups.
 *
 * Names here are the canonical English names. For localized names use the
 * locale helpers in `./locale.ts` (or the `./locales/*` data modules) — they
 * are kept separate so this module stays sync and dependency-free.
 */

import type { ContinentCode, Country } from "./types.ts";
import { COUNTRIES } from "./_data.ts";

export { COUNTRIES };
export type { ContinentCode, Country } from "./types.ts";
export { CONTINENTS } from "./types.ts";

/** Lookup map: alpha-2 ISO code -> Country. */
export const ISO_MAP: Map<string, Country> = new Map(
	COUNTRIES.map((c) => [c.iso, c]),
);

/** Lookup map: alpha-3 ISO code -> Country. */
export const ISO3_MAP: Map<string, Country> = new Map(
	COUNTRIES.map((c) => [c.iso3, c]),
);

/** Lookup map: ISO numeric code -> Country. */
export const NUMERIC_MAP: Map<string, Country> = new Map(
	COUNTRIES.map((c) => [c.numeric, c]),
);

/** Lookup map: dial code -> Country[]. Multiple countries can share a code (e.g. +1). */
export const DIAL_CODE_MAP: Map<string, Country[]> = (() => {
	const m = new Map<string, Country[]>();
	for (const c of COUNTRIES) {
		const arr = m.get(c.dialCode);
		if (arr) arr.push(c);
		else m.set(c.dialCode, [c]);
	}
	return m;
})();

/**
 * Unique dial codes sorted longest-first, for prefix detection during paste.
 * Longest-first ensures `+1684` (American Samoa) matches before `+1` (US).
 */
export const DIAL_CODES_DESC: string[] = [...new Set(COUNTRIES.map((c) => c.dialCode))]
	.sort((a, b) => b.length - a.length || a.localeCompare(b));

/** Find a country by alpha-2 ISO code (case-insensitive). */
export function byIso(iso: string): Country | undefined {
	return ISO_MAP.get(iso.toUpperCase());
}

/** Find a country by alpha-3 ISO code (case-insensitive). */
export function byIso3(iso3: string): Country | undefined {
	return ISO3_MAP.get(iso3.toUpperCase());
}

/** Find a country by ISO numeric code (accepts `"703"`, `"04"`, `4`, ...). */
export function byNumeric(numeric: string | number): Country | undefined {
	return NUMERIC_MAP.get(String(numeric).padStart(3, "0"));
}

/**
 * Find all countries sharing a dial code. Pass with or without a leading `+`.
 * Returns `[]` for an unknown code.
 */
export function byDialCode(dialCode: string | number): Country[] {
	return DIAL_CODE_MAP.get(String(dialCode).replace(/^\+/, "")) ?? [];
}

/** All countries on a given continent, in the canonical (English-name) order. */
export function byContinent(continent: ContinentCode): Country[] {
	return COUNTRIES.filter((c) => c.continent === continent);
}
