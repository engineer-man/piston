{pkgs, piston, ...}:
let
    nugetPkg = pkgs.stdenv.mkDerivation {
        pname = "fsharp-nuget-packages";
        version = pkgs.dotnet-sdk.version;

        dontUnpack = true;
        dontBuild = true;
        dontConfigure = true;
        dontFixup = true;
        dontPatch = true;

        buildInputs = [
            pkgs.dotnet-sdk
        ];
        installPhase = ''
            mkdir $out
            cd $out
            export HOME=$PWD
            dotnet new console -lang F# -o fs_cache_application
            rm -rf fs_cache_application
        '';
    };
    pkg = pkgs.dotnet-sdk;
in piston.mkRuntime {
    language = "fsharp";
    version = pkg.version;
    runtime = "dotnet-sdk";

    aliases = [
        "fsharp.net"
        "fs"
        "f#"
        "fs.net"
        "f#.net"
        "fsharp-dotnet"
        "fs-dotnet"
        "f#-dotnet"
        "dotnet-fsharp"
        "dotnet-fs"
        "dotnet-fs"
    ];

    compile = ''
        export HOME=${nugetPkg}
        ${pkg}/dotnet build --help > /dev/null # Supress welcome message
        first_file=$1
        shift
        rename 's/$/\.fs/' "$@" # Add .fs extension
        ${pkg}/dotnet new console -lang F# -o . --no-restore
        mv $first_file Program.fs
        ${pkg}/dotnet restore --source ${nugetPkg}/.nuget/packages
        ${pkg}/dotnet build --no-restore
    '';

    run = ''
        export HOME=${nugetPkg}
        shift
        ${pkg}/dotnet bin/Debug/net6.0/$(basename $(realpath .)).dll "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.fs" = ''
                    open System

                    [<EntryPoint>]
                    let main argv =
                        Console.WriteLine argv[0]
                        0
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.fs";
        })
    ];
}
