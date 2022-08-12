{pkgs, piston, ...}:
let
    piston-python-packages = python-packages: with python-packages; [
        numpy
        scipy
        pandas
        pycrypto
        whoosh
        bcrypt
        passlib
        sympy
    ];
    pkg = pkgs.python3.withPackages piston-python-packages;
in piston.mkRuntime {
    language = "python3";
    version = pkgs.python3.version;

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
