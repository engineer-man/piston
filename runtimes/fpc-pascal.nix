{pkgs, piston, ...}:
let
    binutilsPkg = pkgs.binutils;
    pkg = pkgs.fpc;
in piston.mkRuntime {
    language = "pascal";
    version = pkg.version;

    runtime = "fpc";

    aliases = [
        "freepascal"
        "pp"
        "pas"
    ];

    compile = ''
        export PATH="${binutilsPkg}/bin:$PATH"
        ${pkg}/bin/fpc -oout -v0 "$@"
        chmod +x out
    '';

    run = ''
        shift
        ./out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.pp" = ''
                    program test;
                    begin
                        writeln(paramStr(1));
                    end.
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.pp";
        })
    ];
}
