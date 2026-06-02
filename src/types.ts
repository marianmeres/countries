/**
 * Shared types for `@marianmeres/countries`.
 *
 * Kept dependency-free and side-effect-free so they can be imported from both
 * the zero-dependency core and the optional `./search` / `./locales/*` entry
 * points without pulling anything else in.
 */

/**
 * ISO 3166-1 alpha-2 continent code.
 *
 * - `AF` Africa, `AN` Antarctica, `AS` Asia, `EU` Europe,
 *   `NA` North America, `OC` Oceania, `SA` South America.
 *
 * Transcontinental countries are assigned their primary (geographic) continent.
 */
export type ContinentCode = "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";

/** Human-readable English continent names, keyed by {@link ContinentCode}. */
export const CONTINENTS: Record<ContinentCode, string> = {
	AF: "Africa",
	AN: "Antarctica",
	AS: "Asia",
	EU: "Europe",
	NA: "North America",
	OC: "Oceania",
	SA: "South America",
};

/** A single country record. */
export interface Country {
	/** ISO 3166-1 alpha-2 code, e.g. `"SK"`. Unique. */
	iso: string;
	/** ISO 3166-1 alpha-3 code, e.g. `"SVK"`. Unique. */
	iso3: string;
	/** ISO 3166-1 numeric code as a zero-padded string, e.g. `"703"`. Unique. */
	numeric: string;
	/** Canonical English name, e.g. `"Slovakia"`. This is the default display name. */
	name: string;
	/** Name in the country's primary native language, e.g. `"Slovensko"` (best-effort). */
	nativeName: string;
	/** Dial code without the leading `+`, e.g. `"421"`. Not unique (e.g. `+1` is shared). */
	dialCode: string;
	/** Country flag emoji, e.g. `"🇸🇰"`. */
	flag: string;
	/** Primary geographic continent. See {@link ContinentCode}. */
	continent: ContinentCode;
	/** Primary circulating ISO 4217 currency code, e.g. `"EUR"` (best-effort). */
	currency: string;
	/** English capital city name, e.g. `"Bratislava"` (may be empty for a few territories). */
	capital: string;
}

/**
 * A map of ISO 3166-1 alpha-2 code -> localized country name.
 *
 * This is the entire shape of a locale: a plain object you can index directly
 * (`names[iso] ?? country.name`) — there is no translation engine.
 */
export type LocaleNames = Record<string, string>;
