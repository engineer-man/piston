{pkgs, piston, ...}:
let
    pkg = pkgs.j;
in piston.mkRuntime {
    language = "j";
    version = pkg.version;

    aliases = [
        "ijs"
    ];

    run = ''
    ${pkg}/bin/jconsole "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.ijs" = ''
                    echo'OK'
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.ijs";
        })

        (piston.mkTest {
            files = {
                "test.ijs" = ''
                    stdout each |. 2}. ARGV
                '';
            };
            args = ["K" "O"];
            stdin = "";
            packages = [];
            main = "test.ijs";
        })
    ];
}


