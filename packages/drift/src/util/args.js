const arg = require("arg");

const args = {
	"--help": Boolean,
	"-h": "--help",

	"--verbose": arg.COUNT,
	"-v": "--verbose",
};

module.exports = args;
