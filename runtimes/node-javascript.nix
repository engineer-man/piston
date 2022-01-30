{pkgs, piston, ...}:
let
    pkg = pkgs.nodejs;
in piston.mkRuntime {
    language = "javascript";
    version = pkg.version;
    runtime = "node";

    aliases = [
        "node-js"
        "node-javascript"
        "js"
    ];

    run = ''
    ${pkg}/bin/node "$@"
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