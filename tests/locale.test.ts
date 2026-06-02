import { assert, assertEquals, assertRejects } from "@std/assert";
import {
	BUILTIN_LOCALES,
	COUNTRIES,
	getName,
	getRegisteredLocale,
	hasLocale,
	loadLocale,
	registerLocale,
} from "../src/mod.ts";

Deno.test("en is the always-available default", () => {
	assert(hasLocale("en"));
	const en = getRegisteredLocale("en")!;
	assertEquals(en.SK, "Slovakia");
	assertEquals(getName("SK"), "Slovakia");
	assertEquals(getName("SK", "en"), "Slovakia");
});

Deno.test("loadLocale('en') resolves to the English names", async () => {
	const en = await loadLocale("en");
	for (const c of COUNTRIES) assertEquals(en[c.iso], c.name);
});

Deno.test("loadLocale('sk') lazily loads and covers every country", async () => {
	const sk = await loadLocale("sk");
	assertEquals(sk.SK, "Slovensko");
	assertEquals(sk.DE, "Nemecko");
	for (const c of COUNTRIES) {
		assert(
			typeof sk[c.iso] === "string" && sk[c.iso].length > 0,
			`missing sk for ${c.iso}`,
		);
	}
	// once loaded it is synchronously available
	assert(hasLocale("sk"));
	assertEquals(getName("DE", "sk"), "Nemecko");
});

Deno.test("getName falls back to English for unknown locale entries", () => {
	registerLocale("xx", { SK: "Slovensko-XX" }); // partial locale
	assertEquals(getName("SK", "xx"), "Slovensko-XX");
	assertEquals(getName("DE", "xx"), "Germany"); // falls back to English
	assertEquals(getName("ZZ", "xx"), undefined); // unknown iso
});

Deno.test("registerLocale round-trips (case-insensitive code)", () => {
	registerLocale("Fr", { SK: "Slovaquie" });
	assertEquals(getName("SK", "fr"), "Slovaquie");
	assert(hasLocale("FR"));
});

Deno.test("loadLocale rejects unknown, unregistered locales", async () => {
	await assertRejects(() => loadLocale("zz"), Error, "Unknown locale");
});

Deno.test("BUILTIN_LOCALES advertises en + sk", () => {
	assert(BUILTIN_LOCALES.includes("en"));
	assert(BUILTIN_LOCALES.includes("sk"));
});
