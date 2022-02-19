{pkgs, piston, ...}:
let
    pkg = pkgs.gdc;
in piston.mkRuntime {
    language = "d";
    version = pkg.version;
    runtime = "gcc";

    aliases = [
        "gdc"
    ];

    compile = ''
        rename 's/.code$/\.d/' "$@" # Add .d
        ${pkg}/bin/gdc *.d
    '';

    run = ''
        shift
        ./a.out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.d" = ''
                    import std.stdio;

                    void main() {
                        writeln("OK");
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.d";
        })
    ];
}