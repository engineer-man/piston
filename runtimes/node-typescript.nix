{pkgs, piston, ...}:
let
    node = pkgs.nodejs;
    pkg = pkgs.nodePackages.typescript;
in piston.mkRuntime {
    language = "typescript";
    version = pkg.version;
    runtime = "node";

    aliases = [
        "ts"
        "node-ts"
        "tsc"
    ];

    compile = ''
        rename 's/$/.ts/' "$@" # Add .ts extension
        ${pkg}/bin/tsc *.ts
    '';

    run = ''
        code="$1.js"
        shift
        ${node}/bin/node "$code" "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.js" = ''
                    console.log("OK");
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.js";
        })
    ];
}