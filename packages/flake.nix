{
  description = "Piston packages repo";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }: 
  let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
    args = {
      inherit pkgs;
      piston = {
      mkRuntime = {
          language,
          version,
          runtime,
          run,
          compile? null,
          aliases? []
        }: let
          packageName = "${runtime}-${language}";
          compileFile = if compile != null then
            pkgs.writeShellScript "compile" compile
            else null;
          runFile = pkgs.writeShellScript "run" run;
          metadataFile = pkgs.writeText "metadata.json" (builtins.toJSON {
            inherit language version runtime aliases;
          });
        in pkgs.runCommandNoCC packageName {}
        (
          ''
            mkdir -p $out/piston
            ln -s ${runFile} $out/piston/run
            ln -s ${metadataFile} $out/piston/metadata.json
          '' + (
            if compileFile != null then
            ''
              ln -s ${compileFile} $out/piston/compile
            '' else "")
        );
      };
    };
  in {
    piston = {
      "node-javascript" = import ./node-javascript.nix args;
    };
  };
}
