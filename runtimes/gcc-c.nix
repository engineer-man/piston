{pkgs, piston, ...}:
let
    pkg = pkgs.gcc;
in piston.mkRuntime {
    language = "c";
    version = pkg.version;
    runtime = "gcc";

    aliases = [
        "gcc"
    ];

    compile = ''
        rename 's/$/\.c/' "$@" # Add .c extension
        ${pkg}/bin/gcc -std=c11 *.c -lm
    '';

    run = ''
        shift
        ./a.out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.c" = ''
                    #include <stdio.h>

                    int main(void) {
                        printf("OK");
                        return 0;
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.c";
        })
    ];
}