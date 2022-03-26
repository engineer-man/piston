{pkgs, piston, ...}:
let
    # All other BF packages are either marked as broken in nix-pkgs
    # or have missing functionality. Yabi isn't perfect either.
    pkg = pkgs.haskellPackages.yabi;
in piston.mkRuntime {
    language = "brainfuck";
    version = pkg.version;

    aliases = [
        "bf"
        "yabi"
    ];

    run = ''
        # Yabi produces messages when parsing the BF file that are sent to stderr
        # Yabi will also break when trying to take more input at EOF
        ${pkg}/bin/yabi "$1" 2> /dev/null
    '';

    tests = [
        # stdout test
        (piston.mkTest {
            files = {
                "test.bf" = ''-[--->+<]>------.----.'';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.bf";
        })

        # stdin test
        (piston.mkTest {
            files = {
                "test.bf" = '',.,.'';
            };
            args = [];
            stdin = "OK";
            packages = [];
            main = "test.bf";
        })

        # bf doesn't take args test
        (piston.mkTest {
            files = {
                "test.bf" = ''-[--->+<]>------.----.'';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.bf";
        })
    ];
}