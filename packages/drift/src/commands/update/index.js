const path = require("path");

const fs = require("../../util/fs");
const nix = require("../../util/nix");
const log = require("../../util/log");

const help = require("./help");
const getArgs = require("./args");

const root = path.resolve(__dirname, "../../");
const drift = path.resolve(root, "index.js");

const command = async () => {
	const args = getArgs();

	log.debug(args);

	if (args["--help"]) {
		help();
		process.exit(0);
	}

	let flake = args["--flake"];

	if (flake && flake.includes(":")) {
		log.fatal("Only paths are supported for --flake.");
		process.exit(1);
	}

	if (flake && !path.isAbsolute(flake)) {
		flake = path.resolve(process.cwd(), flake);
	}

	if (!flake) {
		const hasFlake = await fs.exists("flake.nix");

		if (!hasFlake) {
			log.fatal("No flake specified.");
			process.exit(1);
		}

		flake = process.cwd();
	}

	if (flake.endsWith("flake.nix")) {
		flake = path.dirname(flake);
	}

	const packages = args._.slice(1);

	if (packages.length === 0) {
		const availablePackages = await nix.getFlakePackages(flake);

		const system = await nix.getCurrentSystem();
		for (const availablePackage of availablePackages) {
			if (availablePackage.system === system) {
				packages.push(availablePackage.name);
			}
		}
	}

	if (packages.includes("default")) {
		packages.splice(packages.indexOf("default"), 1);
		packages.push("default");
	}

	const src = args["--src"] || "src";

	const completed = new Set();

	for (const name of packages) {
		const hash = await nix.getPackageHash(flake, name, src);
		const package = await nix.getFlakePackage(flake, name);

		log.trace({ package });

		if (completed.has(package.path)) {
			log.info(`Already processed package "${name}".`);
			continue;
		}

		if (!package.script) {
			log.info(`Package "${name}" has no update script.`);
			completed.add(package.path);
			continue;
		}

		log.info(`Updating package "${name}".`);

		await nix.updateFlakePackage(flake, name, package, hash);

		completed.add(package.path);
	}
};

module.exports = command;
