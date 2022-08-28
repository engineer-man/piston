{ pkgs, piston, ... }:
let basePkg = pkgs.python3;
in piston.mkRuntime (libraries:
  let pkg = basePkg.withPackages libraries;
  in {
    language = "python3";
    version = basePkg.version;

    aliases = [ "py3" "py" "python" ];

    run = ''
      ${pkg}/bin/python3 "$@"
    '';

    tests = [
      (piston.mkTest {
        files = {
          "test.py" = ''
            print("OK")
          '';
        };
      })
    ];
  })
