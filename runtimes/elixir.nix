{pkgs, piston, ...}:
let
    pkg = pkgs.elixir;
in piston.mkRuntime {
    language = "elixir";
    version = pkg.version;

    aliases = [
        "exs"
    ];

    run = ''
    export LC_ALL=en_US.UTF-8
    ${pkg}/bin/elixir "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.exs" = ''
                    IO.puts("OK")
                '';
            };
        })
    ];

    limitOverrides = {
        "max_file_size" = 100000000; # 100MB
    };
}