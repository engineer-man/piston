{pkgs, piston, ...}:
let
    pkg = pkgs.swift;
in piston.mkRuntime {
    language = "swift";
    version = (builtins.parseDrvName pkg.name).version;
    aliases = [];

    run = ''
        ${pkg}/bin/swift -module-cache-path . "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "file0.code" = ''
                    print("OK");
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "file0.code";
        })
    ];
}
