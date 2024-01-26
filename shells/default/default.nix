{
  mkShell,
  nodejs,
  ...
}:
mkShell {
  packages = [nodejs];
}
