{pkgs, piston, ...}:
let 
    pkg = pkgs.ruby_3_1;
in piston.mkRuntime {
    language = "ruby";
    version = pkg.version;

    aliases = [
        "ruby3"
        "rb"
    ];

    run = ''
    ${pkg}/bin/ruby "$@"
    '';

    # Run the following command to test the package:
    # $ ./piston test ruby
    tests = [
        # standard output test
        (piston.mkTest {
            files = {
                "file0.code" = ''
                    puts("OK");
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "file0.code";
        })
        # args test
        (piston.mkTest {
            files = {
                "test.rb" = ''
                    puts $*;
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.rb";
        })
        # stdin test
        (piston.mkTest {
            files = {
                "test.rb" = ''
                    print Kernel.gets;
                '';
            };
            args = [];
            stdin = "OK";
            packages = [];
            main = "test.rb";
        })
    ];
}