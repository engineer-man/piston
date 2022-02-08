{pkgs, piston, ...}:
let
    pkg = pkgs.sbcl; 
in piston.mkRuntime {
    language = "lisp";
    version = pkg.version;
    runtime = "sbcl";

    aliases = [
        "lisp"
        "cl"
        "commonlisp"
    ];

    run = ''
        ${pkg}/bin/sbcl --script "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.cl" = ''
                    (write-line "OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.cl";
        })
    ];
}