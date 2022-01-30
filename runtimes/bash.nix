{pkgs, piston, ...}:
let
    pkg = pkgs.bash;
in piston.mkRuntime {
    language = "bash";

    version = pkg.version;

    runtime = "bash";

    aliases = [
        "sh"
    ];

    run = ''
    ${pkg}/bin/bash "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.sh" = ''
                    echo OK
                '';
            };
        })
    ];
}