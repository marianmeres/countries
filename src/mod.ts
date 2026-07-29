/**
 * @module
 * `@marianmeres/countries` — a thin, dependency-free country dataset with
 * direct lookups, lazy/tree-shakeable i18n (English default), and helpers.
 *
 * Fuzzy "any match" search lives in the optional `@marianmeres/countries/search`
 * entry point; IANA timezones live in `@marianmeres/countries/timezones`;
 * ISO 3166-2 subdivisions (US states, Canadian provinces) live in
 * `@marianmeres/countries/subdivisions`.
 *
 * ```ts
 * import { byIso, byDialCode, byContinent, loadLocale } from "@marianmeres/countries";
 *
 * byIso("sk");          // { iso: "SK", name: "Slovakia", currency: "EUR", ... }
 * byDialCode("+1");     // all NANP countries sharing +1
 * byContinent("EU");    // all European countries
 *
 * const sk = await loadLocale("sk");
 * byContinent("EU").map((c) => sk[c.iso] ?? c.name);
 * ```
 */

export * from "./countries.ts";
export * from "./flag.ts";
export * from "./locale.ts";
