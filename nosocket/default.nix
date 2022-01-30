{pkgs, ...}:
with pkgs; {
  package = stdenv.mkDerivation {
    name = "nosocket-1.0.0";

    dontUnpack = true;


    src = ./nosocket.c;

    buildInputs = [
      libseccomp
    ];
   
    buildPhase = ''
      gcc $src -O2 -Wall -lseccomp -o nosocket
    '';

    installPhase = ''
      mkdir -p $out/bin
      cp nosocket $out/bin
    '';
  };
}