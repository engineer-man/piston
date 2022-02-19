{pkgs, piston, ...}:
let
    pkg = pkgs.swiProlog;
in piston.mkRuntime {
    language = "prolog";
    version = pkg.version;

    aliases = [
        "plg"
    ];
    
    run = ''
        ${pkg}/bin/swipl -g true -t halt "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.pl" = ''
                    :- write('OK'), nl.
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.pl";
        })
    ];
}