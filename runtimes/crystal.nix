{pkgs, piston, ...}:
let
    pkg = pkgs.crystal;
in piston.mkRuntime {
    language = "crystal";
    version = pkg.version;

    aliases = [
        "cr"
    ];

    compile = ''
    ${pkg}/bin/crystal build "$@" -o out --no-color
    chmod +x out
    '';

    run = ''
    shift
    ./out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.cr" = ''
                    puts("OK")
                '';
            };
        })
    ];
}