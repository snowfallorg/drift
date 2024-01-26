const arg = require("arg");
const rootArgs = require("../../util/args");

const getArgs = () =>
	arg(
		{
			...rootArgs,

			"--flake": String,
			"-f": "--flake",

			"--src": String,
		},
		{
			permissive: false,
		},
	);

module.exports = getArgs;
