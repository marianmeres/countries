import { npmBuild, versionizeDeps } from "@marianmeres/npmbuild";

const denoJson = JSON.parse(Deno.readTextFileSync("deno.json"));

await npmBuild({
	name: denoJson.name,
	version: denoJson.version,
	repository: denoJson.name.replace(/^@/, ""),
	// Only the `./search` entry point imports searchable, but it's declared as a
	// normal dependency so it installs for tsc and resolves at runtime. Consumers
	// that never import `./search` tree-shake it out.
	dependencies: versionizeDeps(["@marianmeres/searchable"], denoJson),
	entryPoints: ["mod", "search", "timezones", "locales/sk"],
	// Required so bundlers can tree-shake unused entry points / locale chunks.
	packageJsonOverrides: { sideEffects: false },
});
