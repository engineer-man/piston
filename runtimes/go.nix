{pkgs, piston, ...}:
let
    pkg = pkgs.go;
in piston.mkRuntime {
    language = "go";
    version = pkg.version;

    aliases = [
        "golang"
    ];

    run = ''
        mv $1 $1.go
        filename=*.go
        shift
        GOCACHE=$PWD ${pkg}/bin/go run $filename "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.go" = ''
                    package main

                    import "fmt"

                    func main() {
                        fmt.Println("OK")
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.go";
        })
    ];
}