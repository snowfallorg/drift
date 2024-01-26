const path = require("path");
const util = require("util");
const child = require("child_process");

const fs = require("./fs");
const log = require("./log");

const root = path.resolve(__dirname, "../../");

const exec = util.promisify(child.exec);

const NIX_STORE_REGEX = /^\/nix\/store\/[\w\d]{32}-[^\/]+(?:\/(.+))?$/;

const isStorePath = (file) => {
	return NIX_STORE_REGEX.test(file);
};

const stripStorePath = (file) => {
	return file.replace(NIX_STORE_REGEX, "$1");
};

const escapeNixExpression = (code) => code.replaceAll(/'/g, "'\\''");

const prelude = `
	let
		prelude = {
			system = builtins.currentSystem;

			flatten = value:
				if builtins.isList value then
					builtins.concatMap prelude.flatten value
				else
					[value];

			has-prefix = prefix: text:
				(builtins.substring 0 (builtins.stringLength prefix) text) == prefix;

			map-attrs-to-list = f: attrs:
				builtins.map (name: f name attrs.\${name}) (builtins.attrNames attrs);

			name-value-pair = name: value: { inherit name value; };

			filter-attrs = predicate: attrs:
				builtins.listToAttrs
					(builtins.concatMap
						(name:
							if predicate name attrs.\${name} then
								[(prelude.name-value-pair name attrs.\${name})]
							else
								[]
						)
						(builtins.attrNames attrs)
					);

			get-flake = path:
				let
					is-path = (prelude.has-prefix "/" path) || (prelude.has-prefix "." path);
					flake-uri = if is-path then "path:\${builtins.toString path}" else path;
				in
					builtins.getFlake flake-uri;
		};
	in
`;

const nixEval = async (
	code,
	{ json = false, impure = false, ...execOptions } = {},
) => {
	const expression = [prelude, code].map(escapeNixExpression).join("\n");

	const { stdout } = await exec(
		`nix eval --show-trace ${impure ? "--impure" : ""} ${
			json ? "--json" : ""
		} --expr '${expression}'`,
		{ ...execOptions },
	);

	if (json) {
		return JSON.parse(stdout);
	}

	return stdout;
};

const nixBuild = async (
	target,
	{ link = false, json = false, ...execOptions } = {},
) => {
	const { stdout, stderr } = await exec(
		`nix build --show-trace ${json ? "--json" : ""} --impure ${
			link ? `--out-link '${link}'` : "--no-link"
		} ${target}`,
		{ ...execOptions },
	);

	if (json) {
		return JSON.parse(stdout);
	}

	return { stdout, stderr };
};

const getCurrentSystem = async () => {
	const system = await nixEval("prelude.system", {
		json: true,
		impure: true,
	});

	return system;
};

const getFlakePackages = async (flake) => {
	const code = `
let
	flake = prelude.get-flake "${flake}";
	packages = flake.packages or {};

	get-system-package = system: name: package: {
		inherit system name;
		meta = package.meta or null;
	};

	get-system-packages = system: attrs:
		prelude.map-attrs-to-list (get-system-package system) attrs;

	results = prelude.flatten (prelude.map-attrs-to-list (get-system-packages) packages);
in
	results
	`;

	const packages = await nixEval(code, { json: true, impure: true });

	return packages;
};

const getFlakePackage = async (flake, name) => {
	const code = `
let
	flake = prelude.get-flake "${flake}";
	packages = flake.packages or {};

	package = packages."\${prelude.system}"."${name}" or null;

	update = package.passthru.update or null;
	update-bin =
		if builtins.isString update || builtins.isNull update then
			update
		else
			"\${update}/bin/\${update.mainProgram or update.pname or update.name}";

	position = package.meta.position or null;
in
	if builtins.isNull package then
		null
	else
		{
			name = package.name;
			version = package.version;
			path = "\${package}";
			script = update-bin;
			snowfall = package.meta.snowfall or null;
			inherit position;
		}
	`;

	const package = await nixEval(code, { json: true, impure: true });

	return package;
};

const updateFlakePackage = async (flake, name, package, hash) => {
	const system = await getCurrentSystem();

	await nixBuild(`path:${flake}#packages.${system}.${name}.passthru.update`, {
		json: true,
	});

	let file = null;

	if (
		package.position !== null &&
		!package.position.includes("/pkgs/build-support/trivial-builders/")
	) {
		file = stripStorePath(package.position.split(":")[0]);
	} else if (package.snowfall !== null) {
		file = stripStorePath(package.snowfall.path);
	}

	const { stdout, stderr } = await exec(package.script, {
		cwd: flake,
		env: {
			PATH: `${root}/bin:${process.env.PATH}`,
			DRIFT_NAME: name,
			DRIFT_FILE: file ? path.resolve(flake, file) : undefined,
			DRIFT_CURRENT_VERSION: package.version,
			DRIFT_CURRENT_HASH: hash.value,
			FORCE_COLOR: process.env.FORCE_COLOR || "1",
			LOG_ICONS: process.env.LOG_ICONS || process.stdout.isTTY || "false",
		},
	});

	for (const line of stdout.split("\n")) {
		console.log(line);
	}

	if (stderr) {
		throw new Error(stderr);
	}
};

const getPackageHash = async (flake, name, key) => {
	const code = `
let
	flake = prelude.get-flake "${flake}";
	packages = flake.packages or {};

	package = packages."\${prelude.system}"."${name}";
in
		{
			algorithm = package."${key}".drvAttrs.outputHashAlgo or null;
			value = package."${key}".drvAttrs.outputHash or null;
		}
	`;

	const info = await nixEval(code, { json: true, impure: true });

	return info;
};

// Created using:
//
// raw_sha256=$(echo -n drift | sha256sum | cut -d ' ' -f 1)
// fake_sha256=$(nix hash to-sri --type sha256 $raw_sha256)
// raw_sha512=$(echo -n drift | sha512sum | cut -d ' ' -f 1)
// fake_sha512=$(nix hash to-sri --type sha512 $raw_sha512)
//
// And then removing the prefixed hash type (eg. sha256-).
const FAKE_SHA256_HASH = "C3pGH++7aOUY5RiENppLiLr/20C35XiSHz+IZJ68ZJQ=";
const FAKE_SHA512_HASH =
	"q1y5IA7/jcEIOWVXGUMueO+OG+/HC2nQYEMaSk8YnQF1djvncY1oe1VBbnJ6ENxG85E3omMPwZTZQmxBXCwSyA==";

const HASH_MISMATCH_REGEX =
	/hash mismatch in fixed-output derivation '.+':\n\s+specified:.+\n\s+got:\s+(.+)\n/g;

const getNewPackageHash = async (flake, file, name, hash) => {
	const system = await getCurrentSystem();

	const fake =
		hash.algorithm === "sha256" ? FAKE_SHA256_HASH : FAKE_SHA512_HASH;

	await fs.replace(file, hash.value, fake);

	let stderr;

	try {
		const result = await nixBuild(`path:${flake}#packages.${system}.${name}`, {
			impure: true,
		});

		stderr = result.stderr;
	} catch (error) {
		stderr = error.stderr;
	}

	await fs.replace(file, fake, hash.value);

	if (!stderr) {
		log.error(`No new hash available for package "${name}".`);
		return null;
	}

	const match = HASH_MISMATCH_REGEX.exec(stderr);

	if (!match) {
		throw new Error(`Failed to get new hash for package "${name}". ${stderr}`);
	}

	const sri = match[1];

	let algorithm = "";
	let value = "";

	if (sri.startsWith("sha256-")) {
		algorithm = "sha256";
		value = sri.replace("sha256-", "");
	} else if (sri.startsWith("sha512-")) {
		algorithm = "sha512";
		value = sri.replace("sha512-", "");
	}

	return { algorithm, value };
};

module.exports = {
	nixEval,
	nixBuild,
	getCurrentSystem,
	getFlakePackages,
	getFlakePackage,
	updateFlakePackage,
	getPackageHash,
	getNewPackageHash,
};
