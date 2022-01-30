{pkgs, piston, ...}:
let
    pkg = pkgs.gnu-cobol;
in piston.mkRuntime {
    language = "cobol";
    version = pkg.version;
    runtime = "gnu-cobol";

    aliases = [
        "cob"
    ];

    compile = ''
    ${pkg}/bin/cobc -o binary --free -x -L lib "$@"
    chmod +x binary
    '';

    run = ''
    shift
    ./binary "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.cob" = ''
                    *> Test Program
                    identification division.
                    program-id. ok-test.

                    procedure division.
                    display "OK"
                    goback.
                    end program ok-test.
                '';
            };
        })
    ];
}