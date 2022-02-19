{pkgs, nosocket, ...}:
with pkgs; rec {
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
  container = pkgs.dockerTools.buildLayeredImageWithNixDb {
    name = "piston";
    tag = "base-latest";

    contents = with pkgs; [
      package
      nosocket
      bash
      nixFlakes
      coreutils-full
      cacert.out
      git
      gnutar
      gzip
      gnugrep
      rename
      util-linux
    ];

    extraCommands = ''
      mkdir -p piston/{jobs,runtimes} etc/nix {,var/}tmp run/lock
      echo -e "experimental-features = nix-command flakes" >> etc/nix/nix.conf
      echo "nixbld:x:30000:nixbld1,nixbld10,nixbld11,nixbld12,nixbld13,nixbld14,nixbld15,nixbld16,nixbld17,nixbld18,nixbld19,nixbld2,nixbld20,nixbld21,nixbld22,nixbld23,nixbld24,nixbld25,nixbld26,nixbld27,nixbld28,nixbld29,nixbld3,nixbld30,nixbld31,nixbld32,nixbld4,nixbld5,nixbld6,nixbld7,nixbld8,nixbld9" >> etc/group
      for i in $(seq 1 32)
      do
        echo "nixbld$i:x:$(( $i + 30000 )):30000:Nix build user $i:/var/empty:/run/current-system/sw/bin/nologin" >> etc/passwd
      done

      chmod 1777 {,var/}tmp/
    '';

    config = {
      Cmd = ["${package}/bin/pistond"];
      Env = [
        "NIX_PAGER=cat"
        "USER=nobody"
        "SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt"
        "GIT_SSL_CAINFO=/etc/ssl/certs/ca-bundle.crt"
        "NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt"
         "PATH=${lib.concatStringsSep ":" [
           "/usr/local/sbin"
           "/usr/local/bin"
           "/usr/sbin"
           "/usr/bin"
           "/sbin"
           "/bin"
           "/root/.nix-profile/bin"
           "/nix/var/nix/profiles/default/bin"
           "/nix/var/nix/profiles/default/sbin"
         ]}"
         "MANPATH=${lib.concatStringsSep ":" [
           "/root/.nix-profile/share/man"
           "/nix/var/nix/profiles/default/share/man"
         ]}"
      ];

      ExposedPorts = {
        "2000/tcp" = {};
      };
    };
  };
}