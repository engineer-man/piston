{pkgs, ...}:
with pkgs; {
  package = mkYarnPackage {
    name = "piston";
    src = ./.;

    yarnPreBuild = ''
      mkdir -p $HOME/.node-gyp/${nodejs.version}
      echo 9 > $HOME/.node-gyp/${nodejs.version}/installVersion
      ln -sfv ${nodejs}/include $HOME/.node-gyp/${nodejs.version}
      export npm_config_nodedir=${nodejs}
    '';

    pkgConfig = {
      waitpid = {
        buildInputs = [
          gcc
          gnumake
          python3
        ];

        postInstall = ''
        yarn --offline run install
        '';
      };
    };
  };
}