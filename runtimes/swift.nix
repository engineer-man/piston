{pkgs, piston, ...}:
let
    pkg = pkgs.swift;
in piston.mkRuntime {
    language = "swift";
    version = "5.4.2"; # pkg.version attribute is missing, so pinning it to 5.4.2
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