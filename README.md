# Snowfall Drift

<a href="https://nixos.wiki/wiki/Flakes" target="_blank">
	<img alt="Nix Flakes Ready" src="https://img.shields.io/static/v1?logo=nixos&logoColor=d8dee9&label=Nix%20Flakes&labelColor=5e81ac&message=Ready&color=d8dee9&style=for-the-badge">
</a>
<a href="https://github.com/snowfallorg/lib" target="_blank">
	<img alt="Built With Snowfall" src="https://img.shields.io/static/v1?label=Built%20With&labelColor=5e81ac&message=Snowfall&color=d8dee9&style=for-the-badge">
</a>

<p>
<!--
	This paragraph is not empty, it contains an em space (UTF-8 8195) on the next line in order
	to create a gap in the page.
-->
  
</p>

> Update Nix Flake package sources.

## Installation

### Nix Profile

You can install this package imperatively with the following command.

```bash
nix profile install github:snowfallorg/drift
```

### Nix Configuration

You can install this package by adding it as an input to your Nix Flake.

```nix
{
	description = "My system flake";

	inputs = {
		nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
		unstable.url = "github:nixos/nixpkgs/nixos-unstable";

		# Snowfall Lib is not required, but will make configuration easier for you.
		snowfall-lib = {
			url = "github:snowfallorg/lib";
			inputs.nixpkgs.follows = "nixpkgs";
		};

		snowfall-drift = {
			url = "github:snowfallorg/drift";
			inputs.nixpkgs.follows = "nixpkgs";
		};
	};

	outputs = inputs:
		inputs.snowfall-lib.mkFlake {
			inherit inputs;
			src = ./.;

			overlays = with inputs; [
				# Use the default overlay provided by this flake.
				snowfall-drift.overlays.default

				# There is also a named overlay, though the output is the same.
				snowfall-drift.overlays."package/drift"
			];
		};
}
```

If you've added the overlay from this flake, then in your system configuration you
can add the `snowfallorg.drift` package.

```nix
{ pkgs }:

{
	environment.systemPackages = with pkgs; [
		snowfallorg.drift
	];
}
```

## Usage

### Add an update script

Drift processes packages that contain an `update` attribute. To add an update script, specify a script
derivation in the package's `passthru`.

```nix
# packages/my-package/default.nix
{ pkgs, ... }:
let
    name = "my-package";
    version = "1.0.0";
    hash = "sha256-hash-here";
in
pkgs.stdenv.mkDerivation {
    inherit name version;

    src = pkgs.fetchFromGitHub {
        owner = "my-org";
        repo = "my-repo";
        rev = "v${version}";
        sha256 = hash;
    };

    passthru.update = pkgs.writeShellScriptBin "update-my-package" ''
        set -euo pipefail

        latest="$(${pkgs.curl}/bin/curl -s "https://api.github.com/repos/my-org/my-repo/releases?per_page=1" | ${pkgs.jq}/bin/jq -r ".[0].tag_name" | ${pkgs.gnused}/bin/sed 's/^v//')"

        drift rewrite --auto-hash --new-version "$latest"
    '';
}
```

Drift is made available to update scripts in addition to some environment variables:

| Name                  | Description                                      |
| --------------------- | ------------------------------------------------ |
| DRIFT_NAME            | The name of the package.                         |
| DRIFT_FILE            | The path to the package's Nix file if available. |
| DRIFT_CURRENT_VERSION | The current version of the package.              |
| DRIFT_CURRENT_HASH    | The current hash of the package.                 |

### `drift update`

```
DESCRIPTION

    Update a package.

USAGE

    $ drift update [...package] [options]

OPTIONS

    --flake, -f               The flake to get package information from
    --src                     The source attribute to use for hash information

    --help, -h                Show this help message
    --verbose, -v             Set logging verbosity

EXAMPLE

    $ # Update all packages with update scripts.
    $ drift update --flake /my/flake/dir

    $ # Update specific packages with update scripts.
    $ drift update --flake /my/flake/dir my-package my-other-package

    $ # Update using the hash of a specific package attribute.
    $ drift update --flake /my/flake/dir --src my-upstream-src my-package`
```

### `drift rewrite`

```
DESCRIPTION

    Replace a package's source version and hash.

USAGE

    $ drift rewrite [...package] [options]

OPTIONS

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

EXAMPLE

    > Note: If you are using Snowfall Lib then you do not need to specify "--file".

    $ # Update the version of a package.
    $ drift rewrite --file ./packages/my-package.nix --current-version $DRIFT_CURRENT_VERSION --new-version 10.0.0

    $ # Update the hash of a package.
    $ drift rewrite --file ./packages/my-package.nix --current-hash $DRIFT_CURRENT_HASH --new-hash my-hash-here

    $ # Automatically update the hash of a package using its new version.
    $ drift rewrite --file ./packages/my-package.nix --new-version 10.0.0 --auto-hash

    $ # Calculate hashes using a different source attribute.
    $ drift rewrite --file ./packages/my-package.nix --new-version 10.0.0 --auto-hash --src my-upstream-src

    $ # Update arbitrary text.
    $ drift rewrite --file ./packages/my-package.nix --from my-text --to my-new-text
```
