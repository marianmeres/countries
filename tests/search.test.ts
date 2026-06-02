import { assert, assertEquals } from "@std/assert";
import { createCountrySearch } from "../src/search.ts";
import { loadLocale } from "../src/mod.ts";

const first = (arr: { iso: string }[]) => arr[0]?.iso;

Deno.test("search: prefix on English name", () => {
	const cs = createCountrySearch();
	assertEquals(first(cs.search("germ")), "DE");
	assertEquals(first(cs.search("slovak")), "SK");
});

Deno.test("search: by code (alpha-2 / alpha-3)", () => {
	const cs = createCountrySearch();
	assertEquals(first(cs.search("deu")), "DE"); // alpha-3
	assert(cs.search("sk", "exact").some((c) => c.iso === "SK")); // alpha-2
});

Deno.test("search: fuzzy tolerates typos", () => {
	const cs = createCountrySearch();
	const res = cs.search("germny", "fuzzy", { maxDistance: 2 });
	assert(res.some((c) => c.iso === "DE"), "expected Germany in fuzzy results");
});

Deno.test("search: accent-insensitive via alias", () => {
	const cs = createCountrySearch();
	// CI native name is "Côte d'Ivoire"; alias "Cote d'Ivoire" should match unaccented
	assert(cs.search("cote").some((c) => c.iso === "CI"));
});

Deno.test("search: common aliases (USA, UK, Holland)", () => {
	const cs = createCountrySearch();
	assert(cs.search("USA").some((c) => c.iso === "US"));
	assert(cs.search("uk").some((c) => c.iso === "GB"));
	assert(cs.search("holland").some((c) => c.iso === "NL"));
});

Deno.test("search: custom aliases extend the defaults", () => {
	const cs = createCountrySearch({ aliases: { SK: ["Tatraland"] } });
	assert(cs.search("tatraland").some((c) => c.iso === "SK"));
	assert(cs.search("USA").some((c) => c.iso === "US")); // common still present
});

Deno.test("search: commonAliases:false disables the built-ins", () => {
	const cs = createCountrySearch({ commonAliases: false });
	assertEquals(cs.search("holland").length, 0);
});

Deno.test("search: locale-aware when names are passed in", async () => {
	const sk = await loadLocale("sk");
	const cs = createCountrySearch({ names: sk });
	assert(cs.search("nemecko").some((c) => c.iso === "DE"));
	// English still works because the canonical name is always indexed
	assert(cs.search("germ").some((c) => c.iso === "DE"));
});

Deno.test("search: subset restricts the index", () => {
	const cs = createCountrySearch({
		countries: [{
			iso: "SK",
			iso3: "SVK",
			numeric: "703",
			name: "Slovakia",
			nativeName: "Slovensko",
			dialCode: "421",
			flag: "🇸🇰",
			continent: "EU",
			currency: "EUR",
			capital: "Bratislava",
		}],
	});
	assertEquals(cs.search("germ").length, 0);
	assertEquals(first(cs.search("slov")), "SK");
});
