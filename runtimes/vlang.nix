{pkgs, piston, ...}:
let
    pkg = pkgs.vlang;
in piston.mkRuntime {
    language = "vlang";
    version = pkg.version;

    aliases = [
        "v"
    ];

    run = ''
        # vlang env
        export VMODULES="$PWD"
        export TMPDIR="$PWD"

        # modify file extension
        mv "$1" "$1.v"
        filename="$1.v"
        shift

        ${pkg}/bin/v run "$filename" "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "file0.code" = ''
                    fn main() {
                        println('OK')
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "file0.code";
        })
    ];
}