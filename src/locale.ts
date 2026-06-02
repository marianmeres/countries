/**
 * i18n for country names.
 *
 * English is the default and is baked into the core data (`Country.name`), so
 * it is always available synchronously with zero setup. Other locales are
 * separate, side-effect-free data modules (`./locales/<code>.ts`) that are
 * loaded lazily and code-split — you only pay for the locales you actually use.
 *
 * ```ts
 * import { COUNTRIES, loadLocale } from "@marianmeres/countries";
 * const sk = await loadLocale("sk");        // lazy: fetched only on demand
 * const label = sk[country.iso] ?? country.name; // localized, English fallback
 * ```
 *
 * To register a custom locale (or one you imported yourself), use
 * {@link registerLocale}:
 *
 * ```ts
 * import sk from "@marianmeres/countries/locales/sk"; // static, tree-shakeable
 * registerLocale("sk", sk);
 * ```
 */

import type { LocaleNames } from "./types.ts";
import { COUNTRIES } from "./_data.ts";

export type { LocaleNames } from "./types.ts";

/** The default locale code. English names live on `Country.name`. */
export const DEFAULT_LOCALE = "en";

/**
 * Lazy loaders for the locales bundled with this package.
 *
 * LOAD-BEARING: each value MUST be `() => import("<static string literal>")`.
 * The static literal is what lets bundlers code-split the locale into its own
 * async chunk, and what lets the npm build rewrite the `.ts` specifier to `.js`.
 * Do NOT collapse this into `(code) => import(`./locales/${code}.ts`)` — that
 * silently breaks both the npm build and tree-shaking.
 */
const BUILTIN_LOCALE_LOADERS: Record<string, () => Promise<{ default: LocaleNames }>> = {
	sk: () => import("./locales/sk.ts"),
};

/** Locale codes bundled with this package (loadable via {@link loadLocale}). */
export const BUILTIN_LOCALES: readonly string[] = [
	DEFAULT_LOCALE,
	...Object.keys(BUILTIN_LOCALE_LOADERS),
];

const registry = new Map<string, LocaleNames>();

let englishNames: LocaleNames | undefined;
function getEnglishNames(): LocaleNames {
	if (!englishNames) {
		englishNames = {};
		for (const c of COUNTRIES) englishNames[c.iso] = c.name;
	}
	return englishNames;
}

/**
 * Register (or replace) a locale's name map. Use this for custom locales, or to
 * synchronously install a locale you imported via `@marianmeres/countries/locales/<code>`.
 */
export function registerLocale(code: string, names: LocaleNames): void {
	registry.set(code.toLowerCase(), names);
}

/** Whether a locale is currently available synchronously (registered, or `"en"`). */
export function hasLocale(code: string): boolean {
	const c = code.toLowerCase();
	return c === DEFAULT_LOCALE || registry.has(c);
}

/**
 * Synchronously get an already-available locale's names, or `undefined` if it
 * has not been loaded/registered yet. `"en"` is always available.
 */
export function getRegisteredLocale(code: string): LocaleNames | undefined {
	const c = code.toLowerCase();
	if (c === DEFAULT_LOCALE) return getEnglishNames();
	return registry.get(c);
}

/**
 * Load a locale's name map, resolving lazily.
 *
 * - `"en"` resolves immediately to the canonical English names.
 * - A bundled locale (see {@link BUILTIN_LOCALES}) is dynamically imported,
 *   cached, and registered on first use.
 * - An already-registered custom locale is returned from the registry.
 * - Otherwise the promise rejects.
 */
export async function loadLocale(code: string): Promise<LocaleNames> {
	const c = code.toLowerCase();
	const existing = getRegisteredLocale(c);
	if (existing) return existing;

	const loader = BUILTIN_LOCALE_LOADERS[c];
	if (loader) {
		const mod = await loader();
		registry.set(c, mod.default);
		return mod.default;
	}
	throw new Error(
		`Unknown locale "${code}". Register it first with registerLocale("${code}", names), ` +
			`or use one of: ${BUILTIN_LOCALES.join(", ")}.`,
	);
}

/**
 * Resolve a single country's display name in a given locale, synchronously.
 * Falls back to the English name when the locale (or that entry) is unavailable.
 * Returns `undefined` only when the ISO code itself is unknown.
 */
export function getName(
	iso: string,
	locale: string = DEFAULT_LOCALE,
): string | undefined {
	const key = iso.toUpperCase();
	const english = getEnglishNames();
	if (!(key in english)) return undefined;
	const names = getRegisteredLocale(locale);
	return names?.[key] ?? english[key];
}
