{pkgs, piston, ...}:
let
    pkg = pkgs.php; 
in piston.mkRuntime {
    language = "php";
    version = pkg.version;
    aliases = [];

    run = ''
        ${pkg}/bin/php "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.php" = ''
                    OK
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.php";
        })
    ];
}