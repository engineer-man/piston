{pkgs, piston, ...}:
let
    pkg = pkgs.haskell.compiler.ghcHEAD;
in piston.mkRuntime {
    language = "haskell";
    version = pkg.version;
    runtime = "ghc";

    aliases = [
        "hs"
    ];
    
    compile = ''
        rename 's/$/\.hs/' "$@" # Add .hs extension
        ${pkg}/bin/ghc -dynamic -v0 -o out *.hs
        chmod +x out
    '';

    run = ''
        shift # Filename is only used to compile
        ./out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.hs" = ''
                    main = putStrLn "OK"
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.hs";
        })
    ];
}