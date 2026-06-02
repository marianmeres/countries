/**
 * Flag-emoji helpers. Pure, zero-dependency, no data tables.
 */

const A = 0x1f1e6; // regional indicator symbol letter A
const Z = "Z".charCodeAt(0);
const A_UPPER = "A".charCodeAt(0);

/** True if `iso` is a syntactically valid ISO 3166-1 alpha-2 code (two ASCII letters). */
export function isValidIso(iso: string): boolean {
	return /^[A-Za-z]{2}$/.test(iso);
}

/**
 * Convert an ISO 3166-1 alpha-2 code to its flag emoji, e.g. `"SK"` -> `"🇸🇰"`.
 *
 * Derived purely from the two regional-indicator codepoints, so it works for
 * any well-formed code without a lookup table. Returns `""` for invalid input.
 */
export function isoToFlag(iso: string): string {
	if (!isValidIso(iso)) return "";
	const up = iso.toUpperCase();
	return String.fromCodePoint(
		A + (up.charCodeAt(0) - A_UPPER),
		A + (up.charCodeAt(1) - A_UPPER),
	);
}

/**
 * Inverse of {@link isoToFlag}: `"🇸🇰"` -> `"SK"`. Returns `""` if `flag` is not a
 * pair of regional-indicator symbols. Note this does not validate that the code
 * is an assigned country.
 */
export function flagToIso(flag: string): string {
	const cps = [...flag].map((ch) => ch.codePointAt(0) ?? 0);
	if (cps.length !== 2) return "";
	const iso = cps.map((cp) => String.fromCharCode(A_UPPER + (cp - A))).join("");
	return /^[A-Z]{2}$/.test(iso) && iso.charCodeAt(0) <= Z ? iso : "";
}
