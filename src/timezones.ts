/**
 * IANA timezones by country — opt-in subpath (`@marianmeres/countries/timezones`).
 *
 * Kept out of the core so consumers who don't need timezone data don't pay for
 * it. NOTE: this is a point-in-time snapshot of the IANA tz database (which
 * changes a few times a year); treat it as a convenience, not an authority.
 *
 * ```ts
 * import { timezonesOf } from "@marianmeres/countries/timezones";
 * timezonesOf("SK"); // ["Europe/Prague"]
 * ```
 */

import { TIMEZONES } from "./_timezones.ts";

export { TIMEZONES };

/** IANA timezone identifiers for a country (case-insensitive alpha-2). `[]` if unknown. */
export function timezonesOf(iso: string): string[] {
	return TIMEZONES[iso.toUpperCase()] ?? [];
}
