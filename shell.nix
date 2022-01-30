{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    # nativeBuildInputs is usually what you want -- tools you need to run
    nativeBuildInputs = with pkgs; [
      nodejs-16_x
      jq
      mkdocs
      yarn2nix
      yarn
    ];
}
