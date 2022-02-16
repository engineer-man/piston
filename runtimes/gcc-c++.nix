{pkgs, piston, ...}:
let
    pkg = pkgs.gcc;
in piston.mkRuntime {
    language = "c++";
    version = pkg.version;
    runtime = "gcc";

    aliases = [
        "cpp"
        "g++"
    ];

    compile = ''
        rename 's/$/\.cpp/' "$@" # Add .cpp extension
        ${pkg}/bin/g++ -std=c++17 *.cpp
    '';

    run = ''
        shift
        ./a.out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.cpp" = ''
                    #include <iostream>

                    int main(void) {
                        printf("OK");
                        return 0;
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.cpp";
        })
    ];
}