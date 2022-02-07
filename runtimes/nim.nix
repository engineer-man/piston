{pkgs, piston, ...}:
let
    pkg = pkgs.nim; 
in piston.mkRuntime {
    language = "nim";
    version = pkg.version;
    aliases = [];

    compile = ''
        ${pkg}/bin/nim --hints:off --out:out --nimcache:./ c "$@"
        chmod +x out
    '';

    run = ''
        shift
        ./out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.nim" = ''
                    echo("OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.nim";
        })
    ];
}