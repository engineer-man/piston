{pkgs, piston, ...}:
let
    pkg = pkgs.powershell;
in piston.mkRuntime {
    language = "powershell";
    version = pkg.version;

    aliases = [
        "pwsh"
        "ps"
        "ps1"
    ];
    
    run = ''
        ${pkg}/bin/pwsh "$@"
    '';

    tests = [
        # test different file extension
        (piston.mkTest {
            files = {
                "test.code" = ''
                    echo "OK"
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.code";
        })
        # test argv
        (piston.mkTest {
            files = {
                "test.pwsh" = ''
                    foreach ($s in $args) {
                        Write-Host $s
                    }
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.pwsh";
        })
        # test stdin
        (piston.mkTest {
            files = {
                "test.pwsh" = ''
                    $s = Read-Host
                '';
            };
            args = [];
            stdin = "OK";
            packages = [];
            main = "test.pwsh";
        })
    ];
}