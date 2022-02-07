{pkgs, piston, ...}:
let
    pkg = pkgs.rakudo;
in piston.mkRuntime {
    language = "raku";
    version = pkg.version;

    aliases = [
        "rakudo"
        "perl6"
        "p6"
        "pl6"
    ];

    run = ''
        ${pkg}/bin/raku "$@"
    '';

    tests = [
        # test different extension
        (piston.mkTest {
            files = {
                "file.code" = ''
                    say "OK"
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "file.code";
        })
        # test argv
        (piston.mkTest {
            files = {
                "test.raku" = ''
                    print @*ARGS
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.raku";
        })
        # test stdin
        (piston.mkTest {
            files = {
                "test.raku" = ''
                    say prompt
                '';
            };
            args = [];
            stdin = "OK";
            packages = [];
            main = "test.raku";
        })
    ];
}