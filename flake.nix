{
  description = "Piston packages repo";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }: 
  let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
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
            tests
        }: let
          compileFile = if compile != null then
            pkgs.writeShellScript "compile" compile
            else null;
          runFile = pkgs.writeShellScript "run" run;
          metadata = {
            inherit language version runtime aliases;
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
    allRuntimes = import ./runtimes args;
  in {
    piston = args.piston;
    pistonRuntimes = {
      "bash" = allRuntimes.bash;
    };

    legacyPackages."${system}" = {
      piston = (import ./api { inherit pkgs; }).package;
      nosocket = (import ./nosocket { inherit pkgs; }).package;
    };

    containerImage = pkgs.dockerTools.buildLayeredImageWithNixDb {
      name = "piston";
      tag = "latest";

      contents = with pkgs; [
        self.legacyPackages."${system}".piston
        self.legacyPackages."${system}".nosocket
        bash
        nixFlakes
        coreutils-full
        cacert.out
        git
        gnutar
        gzip
        gnugrep
        util-linux
      ];

      extraCommands = ''
        mkdir -p piston/jobs etc/nix {,var/}tmp run/lock
        echo -e "experimental-features = nix-command flakes" >> etc/nix/nix.conf
        echo "nixbld:x:30000:nixbld1,nixbld10,nixbld11,nixbld12,nixbld13,nixbld14,nixbld15,nixbld16,nixbld17,nixbld18,nixbld19,nixbld2,nixbld20,nixbld21,nixbld22,nixbld23,nixbld24,nixbld25,nixbld26,nixbld27,nixbld28,nixbld29,nixbld3,nixbld30,nixbld31,nixbld32,nixbld4,nixbld5,nixbld6,nixbld7,nixbld8,nixbld9" >> etc/group
        for i in $(seq 1 32)
        do
          echo "nixbld$i:x:$(( $i + 30000 )):30000:Nix build user $i:/var/empty:/run/current-system/sw/bin/nologin" >> etc/passwd
        done
      '';

      config = {
        Cmd = [
          "${self.legacyPackages."${system}".piston}/bin/pistond"
        ];

        Env = [
          "NIX_PAGER=cat"
          "USER=nobody"
          "SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt"
          "GIT_SSL_CAINFO=/etc/ssl/certs/ca-bundle.crt"
          "NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt"

        ];

        ExposedPorts = {
          "2000/tcp" = {};
        };
      };
    };

    
  };
}
