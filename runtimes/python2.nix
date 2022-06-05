{pkgs, piston, ...}:
let
    pkg = pkgs.python2;
in piston.mkRuntime {
    language = "python2";
    version = pkg.version;

    aliases = [
        "py2"
        "python"
        "py"
    ];

    run = ''
    ${pkg}/bin/python2 "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.py" = ''
                    print "OK"
                '';
            };
        })
    ];
}
