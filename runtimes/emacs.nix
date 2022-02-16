{pkgs, piston, ...}:
let
    pkg = pkgs.emacs-nox;
in piston.mkRuntime {
    language = "emacs";
    version = pkg.version;

    aliases = [
        "el"
        "elisp"
    ];

    run = ''
        ${pkg}/bin/emacs -Q --script "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.el" = ''
                    (princ "OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.el";
        })
    ];
}