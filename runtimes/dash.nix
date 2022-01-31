{pkgs, piston, ...}:
let
    pkg = pkgs.dash;
in piston.mkRuntime {
    language = "dash";
    version = pkg.version;

    aliases = [];

    run = ''
    ${pkg}/bin/dash "$@"
    '';
    tests = [
        (piston.mkTest {
            files = {
                "test.dash" = ''
                    echo "OK"
                '';
            };
        })
    ];
}