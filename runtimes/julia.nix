{pkgs, piston, ...}:
let
    pkg = pkgs.julia-bin;
in piston.mkRuntime {
    language = "julia";
    version = pkg.version;

    aliases = [
        "jl"
    ];
    
    run = ''
        ${pkg}/bin/julia --startup-file=no --history-file=no "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.jl" = ''
                    println("OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.jl";
        })
    ];
}