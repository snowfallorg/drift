const kleur = require("kleur");

const help = () => {
	const message = `
${kleur.bold(`DESCRIPTION`)}

    Replace a package's source version and hash.

${kleur.bold(`USAGE`)}

    ${kleur.dim(`$`)} ${kleur.bold(`drift rewrite`)} [...package] [options]

${kleur.bold(`OPTIONS`)}

    --file                    The file to rewrite (defaults to package file with Snowfall Lib)
    --name                    The name of the package output (defaults to current package)
    --flake                   The flake to get package information from (defaults to current flake)
    --current-version         The current version of the package (defaults to current version)
    --new-version             The current version of the package
    --current-hash            The current hash of the package
    --new-hash                The current hash of the package
    --auto-hash               Automatically calculate the new hash
    --src                     The source attribute to use for hash information

    --help, -h                Show this help message
    --verbose, -v             Set logging verbosity

${kleur.bold(`EXAMPLE`)}

    > ${kleur.white(
			`Note: If you are using Snowfall Lib then you do not need to specify "--file".`,
		)}

    ${kleur.dim(`$ # Update the version of a package.`)}
    ${kleur.dim(`$`)} ${kleur.bold(
			`drift rewrite`,
		)} --file ./packages/my-package.nix --current-version $DRIFT_CURRENT_VERSION --new-version 10.0.0

    ${kleur.dim(`$ # Update the hash of a package.`)}
    ${kleur.dim(`$`)} ${kleur.bold(
			`drift rewrite`,
		)} --file ./packages/my-package.nix --current-hash $DRIFT_CURRENT_HASH --new-hash my-hash-here

    ${kleur.dim(
			`$ # Automatically update the hash of a package using its new version.`,
		)}
    ${kleur.dim(`$`)} ${kleur.bold(
			`drift rewrite`,
		)} --file ./packages/my-package.nix --new-version 10.0.0 --auto-hash

    ${kleur.dim(`$ # Calculate hashes using a different source attribute.`)}
    ${kleur.dim(`$`)} ${kleur.bold(
			`drift rewrite`,
		)} --file ./packages/my-package.nix --new-version 10.0.0 --auto-hash --src my-upstream-src
`;

	console.log(message);
};

module.exports = help;
