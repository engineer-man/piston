{
  description = "Piston packages repo";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }:
  let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
    nosocket = self.legacyPackages."${system}".nosocket;
    args = {
      inherit pkgs;
      piston = {
        mkRuntime = builderFn: let
          languagePackagesFn = packages: with packages; [ ];
          buildRes = builderFn languagePackagesFn;
          compileFile = if builtins.hasAttr "compile" buildRes then
            pkgs.writeShellScript "compile" buildRes.compile
            else null;
          runFile = pkgs.writeShellScript "run" buildRes.run;
          metadata = {
            language = buildRes.language;
            version = buildRes.version;
            runtime = buildRes.runtime or null;
            aliases = buildRes.aliases or [];
            limitOverrides = buildRes.limitOverrides or {};
            run = runFile;
            compile = compileFile;
          };
          tests = if (builtins.length buildRes.tests) > 0 then
            buildRes.tests
            else abort "Language ${buildRes.language} doesn't provide any tests";
        in {
          inherit metadata tests;
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
      "none" = { };
    };
    pistonMainstreamRuntimes = [
      "mono-csharp"
      "python3"
      "node-javascript"
      "node-typescript"
      "mono-basic"
    ];

    legacyPackages."${system}" = rec {
      nosocket = (import ./nosocket { inherit pkgs; }).package;
      piston = (import ./api { inherit pkgs nosocket; }).package;
    };

    containers = {
      dev = (import ./api {
        inherit pkgs nosocket;
        isDev = true;
      }).container;

      prod = (import ./api {
        inherit pkgs nosocket;
        isDev = false;
      }).container;
    };
  };
}
