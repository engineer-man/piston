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
        filename="$1"
        rename 's/$/.v/' "$filename"
        shift

        ${pkg}/bin/v run "$filename.v" "$@"
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