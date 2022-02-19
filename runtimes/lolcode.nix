{pkgs, piston, ...}:
let
    pkg = pkgs.lolcode; 
in piston.mkRuntime {
    language = "lolcode";
    version = pkg.version;

    aliases = [
        "lol"
        "lci"
    ];

    run = ''
        ${pkg}/bin/lolcode-lci "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.lol" = ''
                    HAI 1.2
                        CAN HAS STDIO?
                        VISIBLE "OK"
                    KTHXBYE
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.lol";
        })
    ];
}