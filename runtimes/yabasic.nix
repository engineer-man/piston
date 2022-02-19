{pkgs, piston, ...}:
let
    pkg = pkgs.yabasic;
in piston.mkRuntime {
    language = "yabasic";
    version = pkg.version;

    aliases = [
        "basic"
    ];

    run = ''
        ${pkg}/bin/yabasic "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.bas" = ''
                    PRINT "OK"
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.bas";
        })
    ];
}