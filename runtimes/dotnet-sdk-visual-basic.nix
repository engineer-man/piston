{pkgs, piston, ...}:
let
    pkg = pkgs.dotnet-sdk;
    nugetPkg = pkgs.stdenv.mkDerivation {
    pname = "visual-basic-nuget-packages";
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
        dotnet new console -lang VB -o cache_application
        rm -rf cache_application
    '';
};

in piston.mkRuntime {
    language = "visual-basic";
    version = pkg.version;
    runtime = "dotnet-sdk";

    aliases = [
        "visual-basic.net"
        "visual-basic-dotnet"
        "dotnet-visual-basic"
        "vb"
        "vb.net"
        "vb-dotnet"
        "dotnet-vh"
        "basic"
        "basic.net"
        "basic-dotnet"
        "dotnet-basic"
    ];

    compile = ''
        export HOME=${nugetPkg}
        ${pkg}/dotnet build --help > /dev/null # Supress welcome message
        rename 's/$/\.vb/' "$@" # Add .vb extension
        ${pkg}/dotnet new console -lang VB -o . --no-restore
        rm Program.vb
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
                "test.vb" = ''
                    Imports System

                    Module Module1

                        Sub Main(args As String())
                            Console.WriteLine(args(0))
                        End Sub

                    End Module
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.vb";
        })
    ];
}
