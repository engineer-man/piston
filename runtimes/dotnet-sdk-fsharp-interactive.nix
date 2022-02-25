{pkgs, piston, ...}:
let
    pkg = pkgs.dotnet-sdk;
in piston.mkRuntime {
    language = "fsharp-interactive";
    version = pkg.version;
    runtime = "dotnet-sdk";

    aliases = [
        "fsi"
        "fsx"
        "fsi.net"
        "fsi-dotnet"
        "dotnet-fsi"
        "fsharp-interactive.net"
        "fsharp-interactive-dotnet"
        "dotnet-fsharp-interactive"
        "f#-interactive"
        "f#-interactive.net"
        "f#-interactive-dotnet"
        "dotnet-f#-interactive"
        "fs-interactive"
        "fs-interactive.net"
        "fs-interactive-dotnet"
        "dotnet-fs-interactive"
    ];

    run = ''
        export HOME=$PWD
        FILENAME=$1
        rename 's/$/\.fsx/' $FILENAME # Add .fsx extension
        shift
        ${pkg}/dotnet fsi --help > /dev/null
        ${pkg}/dotnet fsi $FILENAME.fsx "$@"
        '';

    tests = [
        (piston.mkTest {
            files = {
                "test.fsx" = ''
                    open System
                    let args : string array = fsi.CommandLineArgs |> Array.tail
                    Console.WriteLine args[0]
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.fsx";
        })
    ];
}
