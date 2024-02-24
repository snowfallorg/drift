const path = require("path");

const fs = require("../../util/fs");
const nix = require("../../util/nix");
const log = require("../../util/log");

const help = require("./help");
const getArgs = require("./args");

const command = async () => {
	const args = getArgs();

	log.debug(args);

	if (args["--help"]) {
		help();
		process.exit(0);
	}

	let file = args["--file"] || process.env.DRIFT_FILE;

	if (!file) {
		log.fatal("No file specified.");
		help();

		process.exit(1);
	}

	if (!path.isAbsolute(file)) {
		file = path.resolve(process.cwd(), file);
	}

	const name = args["--name"] || process.env.DRIFT_NAME;

	if (!name) {
		log.fatal("No name specified.");
		help();

		process.exit(1);
	}

	const logger = log.child("update").child(name);

	const src = args["--src"] || "src";
	const flake = args["--flake"] || process.cwd();

	const original = await fs.read(file);

	let text = original;

	try {
		if (args["--new-version"]) {
			let current = args["--current-version"];

			if (!args["--current-version"]) {
				if (process.env.DRIFT_CURRENT_VERSION) {
					current = process.env.DRIFT_CURRENT_VERSION;
				} else {
					logger.fatal("Missing --current-version argument");
					help();

					process.exit(1);
				}
			}

			if (args["--new-version"] === current) {
				logger.info("Versions are the same, skipping rewrite");
			} else {
				logger.info(
					`Replacing version "${current}" with "${args["--new-version"]}"`,
				);
				text = text.replaceAll(current, args["--new-version"]);
			}
		}

		await fs.write(file, text);

		if (args["--current-hash"]) {
			if (args["--new-hash"]) {
				if (args["--new-hash"] === args["--current-hash"]) {
					logger.info("Hashes are the same, skipping rewrite");
				} else {
					logger.info(
						`Replacing hash "${args["--current-hash"]}" with "${args["--new-hash"]}"`,
					);
					text = text.replaceAll(args["--current-hash"], args["--new-hash"]);
				}
			} else {
				const { algorithm } = await nix.getPackageHash(flake, name, src);

				const hash = await nix.getNewPackageHash(flake, file, name, {
					algorithm,
					value: args["--current-hash"],
				});

				if (hash) {
					if (hash.value === args["--current-hash"]) {
						logger.info("Hashes are the same, skipping rewrite");
					} else {
						logger.info(
							`Replacing hash "${args["--current-hash"]}" with "${hash.value}"`,
						);
						text = text.replaceAll(args["--current-hash"], hash.value);
					}
				}
			}
		} else if (args["--auto-hash"]) {
			const { algorithm, value } = await nix.getPackageHash(flake, name, src);

			if (!value) {
				logger.fatal("Package hash no hash value, cannot auto-generate");

				throw new Error(
					`Package "${name}" has no hash value, but --auto-hash was set.`,
				);
			}

			const hash = await nix.getNewPackageHash(flake, file, name, {
				algorithm,
				value,
			});

			if (hash) {
				if (hash.value === value) {
					logger.info("Hashes are the same, skipping rewrite");
				} else {
					logger.info(`Replacing hash "${value}" with "${hash.value}"`);
					text = text.replaceAll(value, hash.value);
				}
			}
		}

		await fs.write(file, text);
	} catch (error) {
		logger.fatal(`Failed updating file "${file}"`);

		try {
			await fs.write(file, original);
		} catch (error) {
			logger.fail(`Failed to restore original file "${file}"`);
		}

		throw error;
	}
};

module.exports = command;
