/**
 * Fuzzy "any match" country search — opt-in subpath
 * (`@marianmeres/countries/search`).
 *
 * This is the only entry point that pulls in `@marianmeres/searchable`, so the
 * core stays dependency-free: consumers who only need direct lookups
 * (`byIso`, `byDialCode`, ...) never bundle the search index.
 *
 * ```ts
 * import { createCountrySearch } from "@marianmeres/countries/search";
 * import { loadLocale } from "@marianmeres/countries";
 *
 * const cs = createCountrySearch();
 * cs.search("germ");                 // -> [Germany]   (prefix)
 * cs.search("deu");                  // -> [Germany]   (iso3)
 * cs.search("germny", "fuzzy");      // -> [Germany]   (typo-tolerant)
 * cs.search("USA");                  // -> [United States] (alias)
 *
 * // locale-aware: index Slovak names
 * const sk = await loadLocale("sk");
 * const csSk = createCountrySearch({ names: sk });
 * csSk.search("nemecko");            // -> [Germany]
 * ```
 */

import { Searchable } from "@marianmeres/searchable";
import type { Country, LocaleNames } from "./types.ts";
import { byIso, COUNTRIES } from "./countries.ts";

// Re-exported so the `index` escape hatch on CountrySearch references a public type.
export type { Searchable };

/** Search strategy passed through to `@marianmeres/searchable`. */
export type SearchStrategy = "exact" | "prefix" | "fuzzy";

/** Per-query options forwarded to `@marianmeres/searchable`. */
export interface SearchOptions {
	/** Max edit distance for fuzzy search. */
	maxDistance?: number;
	/** Limit the number of results. */
	limit?: number;
	/** Offset into the results (pagination). */
	offset?: number;
}

/** Options for {@link createCountrySearch}. */
export interface CountrySearchOptions {
	/**
	 * Localized display names to index (`iso -> name`), e.g. the result of
	 * `await loadLocale("sk")`. The canonical English name is always indexed too,
	 * so code/English queries keep working regardless of locale. Default: English.
	 */
	names?: LocaleNames;
	/**
	 * Extra search terms per country (`iso -> aliases`). Merged with (added to)
	 * {@link COMMON_ALIASES} unless `commonAliases` is `false`.
	 */
	aliases?: Record<string, string[]>;
	/** Include the built-in {@link COMMON_ALIASES}. Default: `true`. */
	commonAliases?: boolean;
	/** Restrict the index to a subset of countries. Default: all. */
	countries?: Country[];
	/** Default strategy used by {@link CountrySearch.search}. Default: `"prefix"`. */
	strategy?: SearchStrategy;
}

/** A built country search index. Cheap to query, build once and reuse. */
export interface CountrySearch {
	/** Search and return matching countries (best match first). */
	search(query: string, strategy?: SearchStrategy, options?: SearchOptions): Country[];
	/** The underlying `@marianmeres/searchable` index (escape hatch). */
	readonly index: Searchable;
}

/**
 * A small, locale-independent set of common alternative names / abbreviations,
 * keyed by alpha-2 ISO code. Override or extend via {@link CountrySearchOptions.aliases}.
 */
export const COMMON_ALIASES: Record<string, string[]> = {
	US: ["USA", "U.S.", "U.S.A.", "America", "United States of America"],
	GB: ["UK", "U.K.", "Britain", "Great Britain", "England", "Scotland", "Wales"],
	AE: ["UAE", "Emirates"],
	NL: ["Holland"],
	CZ: ["Czechia"],
	MM: ["Burma"],
	CI: ["Cote d'Ivoire"],
	CD: ["DR Congo", "DRC", "Congo-Kinshasa"],
	CG: ["Congo-Brazzaville"],
	KR: ["South Korea", "ROK"],
	KP: ["North Korea", "DPRK"],
	RU: ["Russian Federation"],
	VA: ["Vatican", "Holy See"],
	VN: ["Viet Nam"],
	LA: ["Lao"],
	SY: ["Syrian Arab Republic"],
	TR: ["Türkiye", "Turkiye"],
	MK: ["Macedonia"],
	SZ: ["Swaziland"],
	TL: ["East Timor"],
	CV: ["Cabo Verde"],
};

function mergeAliases(
	iso: string,
	user: Record<string, string[]> | undefined,
	useCommon: boolean,
): string[] {
	const out: string[] = [];
	if (useCommon && COMMON_ALIASES[iso]) out.push(...COMMON_ALIASES[iso]);
	if (user?.[iso]) out.push(...user[iso]);
	return out;
}

/**
 * Build a reusable country search index. Indexes, per country: the localized
 * display name, the canonical English name, alpha-2, alpha-3, dial code, and
 * any aliases. Matching is case- and accent-insensitive.
 */
export function createCountrySearch(options: CountrySearchOptions = {}): CountrySearch {
	const {
		names,
		aliases,
		commonAliases = true,
		countries = COUNTRIES,
		strategy: defaultStrategy = "prefix",
	} = options;

	const index = new Searchable({
		index: "trie",
		caseSensitive: false,
		accentSensitive: false,
	});

	for (const c of countries) {
		const localized = names?.[c.iso];
		const terms = [
			localized,
			c.name,
			c.nativeName,
			c.iso,
			c.iso3,
			c.dialCode,
			...mergeAliases(c.iso, aliases, commonAliases),
		].filter(Boolean) as string[];
		index.add(terms.join(" "), c.iso);
	}

	return {
		index,
		search(query, strategy = defaultStrategy, opts = {}) {
			const ids = index.search(query, strategy, opts);
			const seen = new Set<string>();
			const out: Country[] = [];
			for (const id of ids) {
				if (seen.has(id)) continue;
				seen.add(id);
				const c = byIso(id);
				if (c) out.push(c);
			}
			return out;
		},
	};
}
