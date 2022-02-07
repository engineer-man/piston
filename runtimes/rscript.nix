{pkgs, piston, ...}:
let
    pkg = pkgs.rWrapper;
in piston.mkRuntime {
    language = "rscript";
    version = "4.1.2-wrapper";

    aliases = [
        "r"
    ];

    run = ''
        ${pkg}/bin/Rscript "$@"
    '';

    tests = [
        # test different extension
        (piston.mkTest {
            files = {
                "file.code" = ''
                    cat('OK')
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "file.code";
        })
        # test argv
        (piston.mkTest {
            files = {
                "test.r" = ''
                    cat(commandArgs(trailingOnly=TRUE))
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.r";
        })
        # test stdin
        (piston.mkTest {
            files = {
                "test.r" = ''
                    f <- file("stdin")
                    open(f)
                    while(length(line <- readLines(f,n=1)) > 0) {
                    write(line, stderr())
                        cat(line)
                    }
                '';
            };
            args = [];
            stdin = "OK";
            packages = [];
            main = "test.r";
        })
    ];
}