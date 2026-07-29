import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
	BUILTIN_SUBDIVISIONS,
	getRegisteredSubdivisions,
	hasSubdivisions,
	loadSubdivisions,
	registerSubdivisions,
	type Subdivision,
} from "../src/subdivisions.ts";
import US from "../src/subdivisions/us.ts";
import CA from "../src/subdivisions/ca.ts";
import { byIso } from "../src/mod.ts";

function assertIntegrity(list: Subdivision[], allowedCategories: string[]) {
	const codes = new Set<string>();
	let prevName = "";
	for (const s of list) {
		assert(/^[A-Z]{2}$/.test(s.code), `bad code: ${s.code}`);
		assert(!codes.has(s.code), `duplicate code: ${s.code}`);
		codes.add(s.code);
		assert(s.name.length > 0, `empty name for ${s.code}`);
		assert(
			allowedCategories.includes(s.category),
			`bad category for ${s.code}: ${s.category}`,
		);
		assert(prevName < s.name, `not sorted by name at ${s.name}`);
		prevName = s.name;
	}
}

Deno.test("US: 57 entries (50 states + DC + 6 outlying areas), sorted, unique", () => {
	assertEquals(US.length, 57);
	assertIntegrity(US, ["state", "district", "outlying area"]);

	const byCategory = Object.groupBy(US, (s) => s.category);
	assertEquals(byCategory["state"]?.length, 50);
	assertEquals(byCategory["district"]?.length, 1);
	assertEquals(byCategory["outlying area"]?.length, 6);

	assertEquals(US.find((s) => s.code === "MI")?.name, "Michigan");
	assertEquals(US.find((s) => s.code === "DC")?.category, "district");
	assertEquals(US.find((s) => s.code === "PR")?.category, "outlying area");
});

Deno.test("CA: 13 entries (10 provinces + 3 territories), sorted, unique", () => {
	assertEquals(CA.length, 13);
	assertIntegrity(CA, ["province", "territory"]);

	const byCategory = Object.groupBy(CA, (s) => s.category);
	assertEquals(byCategory["province"]?.length, 10);
	assertEquals(byCategory["territory"]?.length, 3);

	assertEquals(CA.find((s) => s.code === "QC")?.name, "Quebec");
	assertEquals(
		CA.filter((s) => s.category === "territory").map((s) => s.code),
		["NT", "NU", "YT"],
	);
});

Deno.test("subdivision codes are country-scoped suffixes, not global", () => {
	// The same two letters mean different things per namespace — by design
	// (`code` is the ISO 3166-2 suffix; the full code is `<country>-<code>`).
	assertEquals(US.find((s) => s.code === "CA")?.name, "California");
	assertEquals(byIso("CA")?.name, "Canada");
	assertEquals(CA.find((s) => s.code === "SK")?.name, "Saskatchewan");
	assertEquals(byIso("SK")?.name, "Slovakia");
});

Deno.test("US outlying areas that are also ISO 3166-1 countries share their name", () => {
	for (const s of US.filter((x) => x.category === "outlying area")) {
		const country = byIso(s.code);
		if (country) assertEquals(s.name, country.name, `name mismatch for ${s.code}`);
	}
});

Deno.test("BUILTIN_SUBDIVISIONS advertises CA + US, all valid country codes", () => {
	assertEquals([...BUILTIN_SUBDIVISIONS].sort(), ["CA", "US"]);
	for (const iso of BUILTIN_SUBDIVISIONS) {
		assert(byIso(iso), `${iso} is not a known country`);
	}
});

Deno.test("loadSubdivisions lazily loads bundled lists (case-insensitive, cached)", async () => {
	// bundled but not loaded yet: available, but not synchronously
	assert(hasSubdivisions("CA"));
	assertEquals(getRegisteredSubdivisions("CA"), undefined);

	const ca = await loadSubdivisions("ca");
	assertStrictEquals(ca, CA); // same module instance as the static import
	// once loaded it is synchronously available and cached
	assertStrictEquals(getRegisteredSubdivisions("CA"), CA);
	assertStrictEquals(await loadSubdivisions("CA"), CA);

	assertStrictEquals(await loadSubdivisions("US"), US);
});

Deno.test("loadSubdivisions resolves [] for countries without a list", async () => {
	assert(!hasSubdivisions("SK"));
	assertEquals(await loadSubdivisions("SK"), []);
	assertEquals(await loadSubdivisions("ZZ"), []);
	// resolving to [] must not register anything
	assertEquals(getRegisteredSubdivisions("SK"), undefined);
	assert(!hasSubdivisions("SK"));
});

Deno.test("registerSubdivisions round-trips (case-insensitive) and can override", async () => {
	const de: Subdivision[] = [{ code: "BY", name: "Bavaria", category: "state" }];
	registerSubdivisions("de", de);
	assert(hasSubdivisions("DE"));
	assertStrictEquals(getRegisteredSubdivisions("DE"), de);
	assertStrictEquals(await loadSubdivisions("De"), de);

	// registered lists take precedence over bundled ones
	const usOverride: Subdivision[] = [{
		code: "MI",
		name: "Michigan",
		category: "state",
	}];
	registerSubdivisions("US", usOverride);
	assertStrictEquals(await loadSubdivisions("US"), usOverride);
	// restore the bundled list for any later tests
	registerSubdivisions("US", US);
});
