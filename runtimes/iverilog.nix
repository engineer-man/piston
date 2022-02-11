{pkgs, piston, ...}:
let
    pkg = pkgs.verilog;
in piston.mkRuntime {
    language = "iverilog";
    version = pkg.version;

    aliases = [
        "verilog"
        "vvp"
    ];

    compile = ''
        rename 's/$/\.v/' "$@" # Add .v extension
        ${pkg}/bin/iverilog *.v
    '';

    run = ''
        shift
        ${pkg}/bin/vvp a.out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.verilog" = ''
                    module ok;
                        initial
                            begin
                            $display("OK");
                            $finish ;
                            end
                    endmodule

                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.verilog";
        })
    ];
}