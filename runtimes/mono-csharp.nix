{pkgs, piston, ...}:
let
    pkg = pkgs.mono; 
in piston.mkRuntime {
    language = "csharp";
    version = pkg.version;
    runtime = "mono";

    aliases = [
        "mono"
        "mono-csharp"
        "mono-c#"
        "mono-cs"
        "c#"
        "cs"
    ];

    compile = ''
        rename 's/$/\.cs/' "$@" # Add .cs extension
        ${pkg}/bin/csc -out:out *.cs
    '';

    run = ''
        shift
        ${pkg}/bin/mono out "$@"
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
                            Console.WriteLine("OK");
                        }
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.cs";
        })
    ];
}