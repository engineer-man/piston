{pkgs, piston, ...}:
let
    pkg = pkgs.swift;
in piston.mkRuntime {
    language = "swift";
    version = "5.4.2";
    aliases = [];

    run = ''
        ls ${pkg}
        ${pkg}/bin/swift -module-cache-path . "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.swift" = ''
                    print("OK");
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.swift";
        })
    ];
}