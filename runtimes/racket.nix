{pkgs, piston, ...}:
let
    pkg = pkgs.racket-minimal;
in piston.mkRuntime {
    language = "racket";
    version = pkg.version;

    aliases = [
        "rkt"
    ];

    run = ''
        ${pkg}/bin/racket "$@"
    '';

    tests = [
        # test different file extension
        (piston.mkTest {
            files = {
                "file.code" = ''
                    #lang racket
                    (display "OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "file.code";
        })
        #test argv
        (piston.mkTest {
            files = {
                "test.rkt" = ''
                    #lang racket
                    (for ([arg (current-command-line-arguments)]) (displayln arg))
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.rkt";
        })
        # test stdin
        (piston.mkTest {
            files = {
                "test.rkt" = ''
                    #lang racket
                    (let loop ()
                        (match (read-char)
                            [(? eof-object?) (void)]
                            [c (display c)
                            (loop)]))
                '';
            };
            args = [];
            stdin = "OK";
            packages = [];
            main = "test.rkt";
        })
    ];
}