{pkgs, piston, ...}:
let
    nugetPkg = pkgs.stdenv.mkDerivation {
        pname = "csharp-nuget-packages";
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
            dotnet new console -o cache_application
            rm -rf cache_application
        '';
    };
    pkg = pkgs.dotnet-sdk;
in piston.mkRuntime {
    language = "csharp";
    version = pkg.version;
    runtime = "dotnet-sdk";

    aliases = [
        "csharp.net"
        "c#"
        "cs"
        "c#.net"
        "cs.net"
        "c#-dotnet"
        "cs-dotnet"
        "csharp-dotnet"
        "dotnet-c#"
        "dotnet-cs"
        "dotnet-csharp"
    ];

    compile = ''
        export HOME=${nugetPkg}
        ${pkg}/dotnet build --help > /dev/null # Supress welcome message
        rename 's/$/\.cs/' "$@" # Add .cs extension
        ${pkg}/dotnet new console -o . --no-restore
        rm Program.cs
        ${pkg}/dotnet restore --source ${nugetPkg}/.nuget/packages
        ${pkg}/dotnet build --no-restore
    '';

    run = ''
        export HOME=$PWD
        shift
        ${pkg}/dotnet bin/Debug/net6.0/$(basename $(realpath .)).dll "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.cs" = ''
                    using System;

                    public class Test
                    {
                        public static void Main(string[] args)
                        {
                            Console.WriteLine(args[0]);
                        }
                    }
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.cs";
        })
    ];
}
