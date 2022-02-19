{pkgs, piston, ...}:
let
    pkg = pkgs.lua5_4; # latest lua as of now
in piston.mkRuntime {
    language = "lua";
    version = pkg.version;
    aliases = [];

    run = ''
        ${pkg}/bin/lua "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.lua" = ''
                    print("OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.lua";
        })
    ];
}