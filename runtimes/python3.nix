{pkgs, piston, ...}:
let
    pkg = pkgs.python3;
in piston.mkRuntime {
    language = "python3";
    version = pkg.version;

    aliases = [
        "py3"
        "py"
        "python"
    ];

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
}
