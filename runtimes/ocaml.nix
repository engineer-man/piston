{pkgs, piston, ...}:
let
    pkg = pkgs.ocaml; 
in piston.mkRuntime {
    language = "ocaml";
    version = pkg.version;

    aliases = [
        "ml"
    ];

    compile = ''
        rename 's/$/\.ml/' "$@" # Add .ml extension
        ${pkg}/bin/ocamlc -o out *.ml
    '';

    run = ''
        shift
        ./out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.ml" = ''
                    print_string "OK\n";
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.ml";
        })
    ];
}