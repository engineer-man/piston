{pkgs, piston, ...}:
let
    pkg = pkgs.gawk;
in piston.mkRuntime {
    language = "awk";
    version = pkg.version;
    runtime = "gawk";

    aliases = [];


    run = ''
    ${pkg}/bin/gawk -f "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.awk" = ''
                    {print "OK"}
                '';
            };
            stdin = "\n"; # awk needs some line input
        })
    ];
}