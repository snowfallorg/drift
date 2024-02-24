const arg = require("arg");
const rootArgs = require("../../util/args");

const getArgs = () =>
	arg(
		{
			...rootArgs,

			"--name": String,
			"--file": String,
			"--flake": String,

			"--current-version": String,
			"--new-version": String,

			"--current-hash": String,
			"--new-hash": String,
			"--auto-hash": Boolean,

			"--src": String,

			"--from": String,
			"--to": String,
		},
		{
			permissive: false,
		},
	);

module.exports = getArgs;
