{pkgs, piston, ...}:
let
    pkg = pkgs.perl; 
in piston.mkRuntime {
    language = "perl";
    version = pkg.version;

    aliases = [
        "pl"
    ];

    run = ''
        ${pkg}/bin/perl "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.pl" = ''
                    print("OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.pl";
        })
    ];
}