{pkgs, piston, ...}:
let
    pkg = pkgs.dart;
in piston.mkRuntime {
    language = "dart";
    version = pkg.version;

    aliases = [];

    run = ''
    ${pkg}/bin/dart run "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.dart" = ''
                    void main() {
                        print('OK');
                    }
                '';
            };
        })
    ];
}