const kleur = require("kleur");

const help = () => {
	const message = `
${kleur.bold(`DESCRIPTION`)}

    Update Nix Flake package sources.

${kleur.bold(`USAGE`)}

    ${kleur.dim(`$`)} ${kleur.bold(`drift`)} <command> [options]

${kleur.bold(`COMMANDS`)}

    update                    Update a package
    rewrite                   Replace a package's source version and hash

${kleur.bold(`OPTIONS`)}

    --help, -h                Show this help message
    --verbose, -v             Set logging verbosity

${kleur.bold(`EXAMPLE`)}

    ${kleur.dim(`$ # Get help for commands.`)}
    ${kleur.dim(`$`)} ${kleur.bold(`drift update`)} --help
`;

	console.log(message);
};

module.exports = help;
