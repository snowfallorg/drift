{
  lib,
  writeScriptBin,
  writeShellScriptBin,
  buildNpmPackage,
  stdenv,
  ...
}: let
in
  buildNpmPackage {
    pname = "drift";
    version = "0.0.1";

    src = ./.;

    npmDepsHash = "sha256-iRZlU3iRuDReyyPDEKRzoTL53gyi8rXTJ1txHn/GdKs=";

    dontNpmBuild = true;
  }
