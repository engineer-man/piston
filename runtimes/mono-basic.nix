{pkgs, piston, ...}:
let
    pkg = pkgs.mono;
in piston.mkRuntime {
    language = "basic";
    version = pkg.version;
    runtime = "mono";

    aliases = [
        "vb"
        "mono-vb"
        "mono-basic"
        "visual-basic"
    ];

    compile = ''
        rename 's/$/\.vb/' "$@" # Add .vb extension
        ${pkg}/bin/vbc -out:out -sdkpath:${pkg}/lib/mono/4.8-api *.vb
    '';

    run = ''
        shift
        ${pkg}/bin/mono out.exe "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.vb" = ''
                    Imports System

                    Module Module1

                        Sub Main()
                            Console.WriteLine("OK")
                        End Sub

                    End Module
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.vb";
        })
    ];
}