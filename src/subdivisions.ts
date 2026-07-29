/**
 * ISO 3166-2 country subdivisions (states, provinces, territories, ...) —
 * opt-in subpath (`@marianmeres/countries/subdivisions`).
 *
 * Kept out of the core so consumers who don't need subdivision data don't pay
 * for it. Each bundled country is its own side-effect-free data module: import
 * it statically (tree-shakeable, nothing else fetched), or load it lazily via
 * {@link loadSubdivisions} (code-split chunk).
 *
 * ```ts
 * // static, tree-shakeable
 * import US from "@marianmeres/countries/subdivisions/us";
 *
 * // lazy, code-split
 * import { loadSubdivisions } from "@marianmeres/countries/subdivisions";
 * const us = await loadSubdivisions("US");
 * // [{ code: "AL", name: "Alabama", category: "state" }, ...]
 * ```
 *
 * Bundled countries are deliberately demand-driven — see
 * {@link BUILTIN_SUBDIVISIONS} — not a full-world ISO 3166-2 dump: most
 * countries' subdivisions have no practical use in address forms. Bring your
 * own lists with {@link registerSubdivisions}. The data is a point-in-time
 * snapshot of ISO 3166-2 — treat it as a convenience, not an authority.
 */

import type { Subdivision } from "./types.ts";

export type { Subdivision } from "./types.ts";

/**
 * Lazy loaders for the subdivision lists bundled with this package, keyed by
 * upper-case ISO 3166-1 alpha-2 country code.
 *
 * LOAD-BEARING: each value MUST be `() => import("<static string literal>")`.
 * The static literal is what lets bundlers code-split the list into its own
 * async chunk, and what lets the npm build rewrite the `.ts` specifier to `.js`.
 * Do NOT collapse this into `(iso) => import(`./subdivisions/${iso}.ts`)` —
 * that silently breaks both the npm build and tree-shaking. (Same rule as
 * `BUILTIN_LOCALE_LOADERS` in `locale.ts`.)
 */
const BUILTIN_SUBDIVISION_LOADERS: Record<
	string,
	() => Promise<{ default: Subdivision[] }>
> = {
	CA: () => import("./subdivisions/ca.ts"),
	US: () => import("./subdivisions/us.ts"),
};

/**
 * Country codes with a subdivision list bundled in this package (loadable via
 * {@link loadSubdivisions}, or importable via
 * `@marianmeres/countries/subdivisions/<lower-cased-iso>`).
 */
export const BUILTIN_SUBDIVISIONS: readonly string[] = Object.keys(
	BUILTIN_SUBDIVISION_LOADERS,
);

const registry = new Map<string, Subdivision[]>();

/**
 * Register (or replace) a country's subdivision list. Use this for countries
 * this package does not bundle, to synchronously install a statically imported
 * bundled list, or to override a bundled list with your own.
 */
export function registerSubdivisions(
	iso: string,
	subdivisions: Subdivision[],
): void {
	registry.set(iso.toUpperCase(), subdivisions);
}

/**
 * Whether a subdivision list is available for a country — bundled (even if not
 * loaded yet) or registered.
 *
 * Note: unlike `hasLocale` this is NOT "available synchronously" — a bundled
 * list still needs `loadSubdivisions` (or a static import + register) first.
 */
export function hasSubdivisions(iso: string): boolean {
	const key = iso.toUpperCase();
	return registry.has(key) || key in BUILTIN_SUBDIVISION_LOADERS;
}

/**
 * Synchronously get an already-loaded/registered subdivision list, or
 * `undefined` if none is available synchronously yet.
 */
export function getRegisteredSubdivisions(iso: string): Subdivision[] | undefined {
	return registry.get(iso.toUpperCase());
}

/**
 * Load a country's subdivision list, resolving lazily.
 *
 * - An already-registered list is returned from the registry.
 * - A bundled country (see {@link BUILTIN_SUBDIVISIONS}) is dynamically
 *   imported, cached, and registered on first use.
 * - Otherwise resolves to `[]` — unlike `loadLocale` this never rejects,
 *   because having no subdivision list is the normal case for most countries
 *   (matching the `timezonesOf` "`[]` if unknown" convention).
 */
export async function loadSubdivisions(iso: string): Promise<Subdivision[]> {
	const key = iso.toUpperCase();
	const existing = registry.get(key);
	if (existing) return existing;

	const loader = BUILTIN_SUBDIVISION_LOADERS[key];
	if (loader) {
		const mod = await loader();
		registry.set(key, mod.default);
		return mod.default;
	}
	return [];
}
