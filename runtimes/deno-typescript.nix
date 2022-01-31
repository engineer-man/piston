{pkgs, piston, ...}:
let
    pkg = pkgs.deno;
in piston.mkRuntime {
    language = "typescript";
    version = pkg.version;
    runtime = "deno";

    aliases = [
        "ts"
        "deno-ts"
    ];

    run = ''
    DENO_DIR=$PWD ${pkg}/bin/deno run $@
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.ts" = ''
                    console.log("OK");
                '';
            };
        })
    ];
}