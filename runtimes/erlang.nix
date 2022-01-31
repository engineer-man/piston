{pkgs, piston, ...}:
let
    pkg = pkgs.erlang;
in piston.mkRuntime {
    language = "erlang";
    version = pkg.version;

    aliases = [
        "erl"
        "escript"
    ];

    run = ''
    ${pkg}/bin/escript "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.erl" = ''
                    
                    main(_) ->
                        io:format("OK~n").
                '';
            };
        })
    ];
}