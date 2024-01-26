const kleur = require("kleur");

const help = () => {
	const message = `
${kleur.bold(`DESCRIPTION`)}

    Update a package.

${kleur.bold(`USAGE`)}

    ${kleur.dim(`$`)} ${kleur.bold(`drift update`)} [...package] [options]

${kleur.bold(`OPTIONS`)}

    --flake, -f               The flake to get package information from
    --src                     The source attribute to use for hash information

    --help, -h                Show this help message
    --verbose, -v             Set logging verbosity

${kleur.bold(`EXAMPLE`)}

    ${kleur.dim(`$ # Update all packages with update scripts.`)}
    ${kleur.dim(`$`)} ${kleur.bold(`drift update`)} --flake /my/flake/dir

    ${kleur.dim(`$ # Update specific packages with update scripts.`)}
    ${kleur.dim(`$`)} ${kleur.bold(
			`drift update`,
		)} --flake /my/flake/dir my-package my-other-package

    ${kleur.dim(`$ # Update using the hash of a specific package attribute.`)}
    ${kleur.dim(`$`)} ${kleur.bold(
			`drift update`,
		)} --flake /my/flake/dir --src my-upstream-src my-package
`;

	console.log(message);
};

module.exports = help;
