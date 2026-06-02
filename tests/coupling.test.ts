import { assert } from "@std/assert";

/**
 * Guard the core's dependency boundary. These are cheap source scans (not a
 * bundler check), but they catch the accidental coupling that would silently
 * blow up bundle size: the zero-dependency core must NOT statically import
 * `@marianmeres/searchable` or any locale data module. The locale loader is
 * allowed to reference locales only via a *dynamic* `import()` (lazy/code-split).
 */

const CORE_FILES = [
	"mod.ts",
	"countries.ts",
	"flag.ts",
	"locale.ts",
	"types.ts",
	"_data.ts",
];

/** Static `import ... from "x"` / `export ... from "x"` specifiers (not dynamic import()). */
function staticSpecifiers(src: string): string[] {
	const re = /^\s*(?:import|export)\b[^;\n]*?\bfrom\s*["']([^"']+)["']/gm;
	return [...src.matchAll(re)].map((m) => m[1]);
}

Deno.test("core does not statically import searchable or locale data", async () => {
	for (const file of CORE_FILES) {
		const src = await Deno.readTextFile(new URL(`../src/${file}`, import.meta.url));
		for (const spec of staticSpecifiers(src)) {
			assert(
				!spec.includes("@marianmeres/searchable"),
				`${file} statically imports searchable: ${spec}`,
			);
			assert(
				!/\/locales\//.test(spec),
				`${file} statically imports a locale module: ${spec}`,
			);
		}
	}
});

Deno.test("locale loader references locales only via dynamic import()", async () => {
	const src = await Deno.readTextFile(new URL("../src/locale.ts", import.meta.url));
	// the only mention of a locale module must be inside import("...")
	const dynamicHits = [...src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((m) =>
		m[1]
	);
	assert(
		dynamicHits.some((s) => s.includes("/locales/")),
		"expected a dynamic locale import",
	);
	assert(
		staticSpecifiers(src).every((s) => !s.includes("/locales/")),
		"locale.ts must not statically import a locale",
	);
});
