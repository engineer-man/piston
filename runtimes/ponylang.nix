{pkgs, piston, ...}:
let
    pkg = pkgs.ponyc; 
in piston.mkRuntime {
    language = "ponylang";
    version = pkg.version;
    aliases = [
        "pony"
        "ponyc"
    ];

    compile = ''
        rename 's/$/.pony/' "$@" # Add .pony extension
        ${pkg}/bin/ponyc -b out
    '';

    run = ''
        shift
        ./out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.pony" = ''
                    actor Main
                        new create(env: Env) =>
                            env.out.print("OK")
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.pony";
        })
    ];
}