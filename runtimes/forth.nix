{pkgs, piston, ...}:
let
    pkg = pkgs.gforth;
in piston.mkRuntime {
    language = "forth";
    version = pkg.version;
    runtime = "forth";

    aliases = [
        "gforth"
    ];

    run = ''
    ${pkg}/bin/gforth "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.forth" = ''
                .( OK) bye
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.forth";
        })
    ];
}
