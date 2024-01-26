#!/usr/bin/env node

const fs = require("fs");
const arg = require("arg");
const path = require("path");
const child = require("child_process");

const log = require("./util/log");
const help = require("./util/help");
const rootArgs = require("./util/args");
const commands = require("./commands");

const script = path.resolve(__filename);

const main = async () => {
	log.debug("Init.");

	const args = arg(rootArgs, {
		permissive: true,
	});

	if (args["--help"] && args._.length === 0) {
		help();
		process.exit(0);
	}

	if (args._.length === 0) {
		log.fatal("No command specified.");
		log.trace("Printing root help message due to error.");
		help();
		process.exit(1);
	}

	const command = args._[0];

	if (command in commands) {
		log.trace(`Executing command "${command}".`);
		await commands[command]();
	} else {
		log.fatal(`Unknown command "${command}".`);
		process.exit(1);
	}
};

main().catch((error) => {
	log.fatal(error.message || error);
	for (const line of error.stack.split("\n").slice(1)) {
		log.fatal(line);
	}

	process.exit(1);
});
