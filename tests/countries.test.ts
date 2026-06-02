import { assert, assertEquals } from "@std/assert";
import {
	byContinent,
	byDialCode,
	byIso,
	byIso3,
	byNumeric,
	type ContinentCode,
	CONTINENTS,
	COUNTRIES,
	DIAL_CODE_MAP,
	DIAL_CODES_DESC,
	ISO_MAP,
} from "../src/mod.ts";
import { isoToFlag } from "../src/flag.ts";
import { SEED } from "../scripts/_seed.ts";

const EXPECTED_COUNT = 234;

Deno.test("data: generated COUNTRIES is in sync with the seed (run `deno task gen`)", () => {
	assertEquals(COUNTRIES.map((c) => c.iso), SEED.map((s) => s.iso));
	for (const s of SEED) {
		const c = byIso(s.iso)!;
		// the seed fields are authoritative and must never be mutated by enrichment
		assertEquals({ name: c.name, dialCode: c.dialCode, flag: c.flag }, {
			name: s.name,
			dialCode: s.dialCode,
			flag: s.flag,
		});
	}
});

Deno.test("data: expected membership count", () => {
	assertEquals(COUNTRIES.length, EXPECTED_COUNT);
});

Deno.test("data: every field is well-formed", () => {
	const validContinents = new Set(Object.keys(CONTINENTS));
	for (const c of COUNTRIES) {
		assert(/^[A-Z]{2}$/.test(c.iso), `bad iso: ${c.iso}`);
		assert(/^[A-Z]{3}$/.test(c.iso3), `bad iso3: ${c.iso} ${c.iso3}`);
		assert(/^\d{3}$/.test(c.numeric), `bad numeric: ${c.iso} ${c.numeric}`);
		assert(c.name.length > 0, `empty name: ${c.iso}`);
		assert(c.nativeName.length > 0, `empty nativeName: ${c.iso}`);
		assert(/^\d+$/.test(c.dialCode), `bad dialCode: ${c.iso} ${c.dialCode}`);
		assert(/^[A-Z]{3}$/.test(c.currency), `bad currency: ${c.iso} ${c.currency}`);
		assert(
			validContinents.has(c.continent),
			`bad continent: ${c.iso} ${c.continent}`,
		);
		assert(typeof c.capital === "string", `bad capital: ${c.iso}`);
	}
});

Deno.test("data: iso / iso3 / numeric are unique", () => {
	for (const key of ["iso", "iso3", "numeric"] as const) {
		const values = COUNTRIES.map((c) => c[key]);
		assertEquals(new Set(values).size, values.length, `duplicate ${key}`);
	}
});

Deno.test("data: flag emoji matches the ISO code", () => {
	for (const c of COUNTRIES) {
		assertEquals(isoToFlag(c.iso), c.flag, `flag mismatch for ${c.iso}`);
	}
});

Deno.test("lookups: maps are derived consistently from COUNTRIES", () => {
	assertEquals(ISO_MAP.size, COUNTRIES.length);
	for (const c of COUNTRIES) {
		assertEquals(ISO_MAP.get(c.iso), c);
		assert(DIAL_CODE_MAP.get(c.dialCode)?.includes(c));
	}
	const flat = [...DIAL_CODE_MAP.values()].flat();
	assertEquals(flat.length, COUNTRIES.length);
});

Deno.test("lookups: DIAL_CODES_DESC is unique and sorted longest-first", () => {
	const unique = new Set(COUNTRIES.map((c) => c.dialCode));
	assertEquals(DIAL_CODES_DESC.length, unique.size);
	for (let i = 1; i < DIAL_CODES_DESC.length; i++) {
		assert(
			DIAL_CODES_DESC[i - 1].length >= DIAL_CODES_DESC[i].length,
			`not longest-first at ${i}`,
		);
	}
	// the longest-first invariant is what makes paste prefix detection correct
	assert(DIAL_CODES_DESC.indexOf("1684") < DIAL_CODES_DESC.indexOf("1"));
});

Deno.test("byIso: case-insensitive, miss returns undefined", () => {
	assertEquals(byIso("SK")?.name, "Slovakia");
	assertEquals(byIso("sk")?.name, "Slovakia");
	assertEquals(byIso("ZZ"), undefined);
});

Deno.test("byIso3 / byNumeric", () => {
	assertEquals(byIso3("svk")?.iso, "SK");
	assertEquals(byNumeric("703")?.iso, "SK");
	assertEquals(byNumeric(703)?.iso, "SK");
	assertEquals(byNumeric("4")?.iso, "AF"); // zero-pad "004"
	assertEquals(byIso3("ZZZ"), undefined);
});

Deno.test("byDialCode: shared +1 returns the whole NANP group, accepts +", () => {
	const plain = byDialCode("1");
	const plus = byDialCode("+1");
	assertEquals(plain, plus);
	assert(plain.length > 1);
	const isos = plain.map((c) => c.iso);
	assert(isos.includes("US") && isos.includes("CA"));
	assertEquals(byDialCode("000"), []);
});

Deno.test("byContinent: returns the right bucket", () => {
	const eu = byContinent("EU");
	assert(eu.some((c) => c.iso === "SK"));
	assert(!eu.some((c) => c.iso === "US"));
	// every country is reachable through exactly one continent bucket
	const total = (Object.keys(CONTINENTS) as ContinentCode[])
		.reduce((n, k) => n + byContinent(k).length, 0);
	assertEquals(total, COUNTRIES.length);
});
