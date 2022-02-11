{pkgs, piston, ...}:
let
    pkg = pkgs.jelly;
in piston.mkRuntime {
    language = "jelly";
    version = pkg.version;
    aliases = [];

    run = ''
        ${pkg}/bin/jelly fu "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.jelly" = ''
                    “OK”
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.jelly";
        })
    ];
}