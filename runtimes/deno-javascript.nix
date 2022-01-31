{pkgs, piston, ...}:
let
    pkg = pkgs.deno;
in piston.mkRuntime {
    language = "javascript";
    version = pkg.version;
    runtime = "deno";

    aliases = [
        "js"
        "deno-js"
    ];

    run = ''
    DENO_DIR=$PWD ${pkg}/bin/deno run $@
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.js" = ''
                    console.log("OK");
                '';
            };
        })
    ];
}