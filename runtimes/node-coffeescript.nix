{pkgs, piston, ...}:
let
    pkg = pkgs.nodePackages.coffee-script;
in piston.mkRuntime {
    language = "coffeescript";
    version = pkg.version;
    runtime = "node";

    aliases = [
        "coffee"
    ];

    run = ''
        ${pkg}/bin/coffee "$@"
    '';

    tests = [
        # stdout test
        (piston.mkTest {
            files = {
                "test.coffee" = ''
                    console.log "OK"
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.coffee";
        })

        # args test
        (piston.mkTest {
            files = {
                "test.coffee" = ''
                    console.log process.argv[2]
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.coffee";
        })

        # stdin test
        (piston.mkTest {
            files = {
                "test.coffee" = ''
                    process.stdin.on('data', (data) => console.log(data.toString()))
                '';
            };
            args = [];
            stdin = "OK";
            packages = [];
            main = "test.coffee";
        })
    ];
}