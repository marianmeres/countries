import { assert, assertEquals } from "@std/assert";
import { flagToIso, isoToFlag, isValidIso } from "../src/flag.ts";

Deno.test("isValidIso", () => {
	assert(isValidIso("SK"));
	assert(isValidIso("sk"));
	assert(!isValidIso("S"));
	assert(!isValidIso("SKK"));
	assert(!isValidIso("S1"));
});

Deno.test("isoToFlag", () => {
	assertEquals(isoToFlag("SK"), "🇸🇰");
	assertEquals(isoToFlag("us"), "🇺🇸");
	assertEquals(isoToFlag("bad"), "");
});

Deno.test("flagToIso is the inverse of isoToFlag", () => {
	for (const iso of ["SK", "US", "DE", "JP"]) {
		assertEquals(flagToIso(isoToFlag(iso)), iso);
	}
	assertEquals(flagToIso("not a flag"), "");
});
