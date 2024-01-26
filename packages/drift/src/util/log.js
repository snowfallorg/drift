const arg = require("arg");
const {
	default: littlelog,
	parseLogLevelNumber,
	LogLevel,
	configure,
} = require("@littlethings/log");

const rootArgs = require("./args");

const args = arg(rootArgs, {
	permissive: true,
});

if (args["--verbose"]) {
	const level =
		args["--verbose"] > 2
			? LogLevel.Trace
			: parseLogLevelNumber(args["--verbose"]);

	configure({ level });
}

module.exports = littlelog.child("drift");
