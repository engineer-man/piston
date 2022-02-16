{pkgs, piston, ...}:
let
    pkg = pkgs.gfortran;
in piston.mkRuntime {
    language = "fortran";
    version = pkg.version;
    runtime = "gcc";

    aliases = [
        "gfortran"
        "f90"
    ];

    compile = ''
        rename 's/.code$/\.f90/' "$@" # Add .f90 extension
        ${pkg}/bin/gfortran *.f90
    '';

    run = ''
        shift
        ./a.out "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.f90" = ''
                    program test
                        print "(a)", 'OK'
                    end program test
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.f90";
        })
    ];
}