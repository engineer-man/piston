{
  description = "Piston packages repo";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }: 
  let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
    baseContainer = (import ./api {
      inherit pkgs;
      nosocket = self.legacyPackages."${system}".nosocket;
    }).container;
    args = {
      inherit pkgs;
      piston = {
        mkRuntime = {
            language,
            version,
            runtime? null,
            run,
            compile? null,
            packages? null,
            aliases? [],
            limitOverrides? {},
            tests
        }: let
          compileFile = if compile != null then
            pkgs.writeShellScript "compile" compile
            else null;
          runFile = pkgs.writeShellScript "run" run;
          metadata = {
            inherit language version runtime aliases limitOverrides;
            run = runFile;
            compile = compileFile;
            packageSupport = packages != null;
          };
        in {
          inherit packages metadata;
          tests = if (builtins.length tests) > 0 then
            tests
            else abort "Language ${language} doesn't provide any tests";
        };
        mkTest = {
          files,
          args? [],
          stdin? "",
          packages? [],
          main? null
        }: {
          inherit files args stdin packages;
          main = if main == null then
            (
              if (builtins.length (builtins.attrNames files)) == 1 then
                (builtins.head (builtins.attrNames files))
              else abort "Could not determine the main file for test - specify it using the 'main' parameter"
            )
            else main;
        };
      };
    };
    runtimes = import ./runtimes args;
    runtimeList = names: pkgs.lib.filterAttrs (n: v: n == "bash") runtimes;
  in {
    piston = args.piston;
    pistonRuntimes = runtimes;
    pistonRuntimeSets = {
      "all" = runtimes;
      "bash-only" = runtimeList ["bash"];
    };

    legacyPackages."${system}" = rec {
      nosocket = (import ./nosocket { inherit pkgs; }).package;
      piston = (import ./api { inherit pkgs nosocket; }).package;
    };

    container = baseContainer;    
  };
}
