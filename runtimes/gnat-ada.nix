{pkgs, piston, ...}:
let
    pkg = pkgs.gnat;
in piston.mkRuntime {
    language = "ada";
    version = pkg.version;
    runtime = "gnat";

    aliases = [
        "adb"
        "ads"
    ];

    compile = ''
        ${pkg}/bin/gnatmake "$@" -o a.out
    '';

    run = ''
        shift
        ./a.out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.adb" = ''
                    with Text_IO; use Text_IO;
                    with Ada.Command_line; use Ada.Command_Line;
                    procedure hello is
                    begin
                    Put_Line(Argument(1));
                    end hello;
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.adb";
        })
    ];
}
