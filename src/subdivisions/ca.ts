// HAND-MAINTAINED source of truth (unlike the generated locales) — edit here.
// A point-in-time snapshot of ISO 3166-2:CA — a convenience, not an authority.

import type { Subdivision } from "../types.ts";

/**
 * ISO 3166-2:CA subdivisions — 10 provinces + 3 territories (NT, NU, YT) —
 * alphabetical by English name. Side-effect-free data module (tree-shakeable).
 *
 * `code` is the ISO 3166-2 suffix (= Canada Post abbreviation):
 * `"QC"` -> `"CA-QC"`. Names are the canonical English forms (e.g. "Quebec",
 * not "Québec"), consistent with `Country.name`.
 */
// deno-fmt-ignore
// prettier-ignore
const CA: Subdivision[] = [
	{ code: "AB", name: "Alberta", category: "province" },
	{ code: "BC", name: "British Columbia", category: "province" },
	{ code: "MB", name: "Manitoba", category: "province" },
	{ code: "NB", name: "New Brunswick", category: "province" },
	{ code: "NL", name: "Newfoundland and Labrador", category: "province" },
	{ code: "NT", name: "Northwest Territories", category: "territory" },
	{ code: "NS", name: "Nova Scotia", category: "province" },
	{ code: "NU", name: "Nunavut", category: "territory" },
	{ code: "ON", name: "Ontario", category: "province" },
	{ code: "PE", name: "Prince Edward Island", category: "province" },
	{ code: "QC", name: "Quebec", category: "province" },
	{ code: "SK", name: "Saskatchewan", category: "province" },
	{ code: "YT", name: "Yukon", category: "territory" },
];

export default CA;
