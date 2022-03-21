{pkgs, piston, ...}:
let
    pkg = pkgs.llvm;
    clang = pkgs.llvmPackages_13.libcxxClang;
in piston.mkRuntime {
    language = "llvm_ir";
    version = clang.version;

    aliases = [
        "llvm"
        "llvm-ir"
        "ll"
    ];
    
    compile = ''
        ${pkg}/bin/llc "$@" -o binary.s
        ${clang}/bin/clang binary.s -o binary
    '';
    
    run = ''
        shift
        ./binary "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.ll" = ''
                    @.str = private unnamed_addr constant [2 x i8] c"OK"
                            
                    declare i32 @puts(i8* nocapture) nounwind

                    define i32 @main() {
                        %cast210 = getelementptr [2 x i8],[2 x i8]* @.str, i64 0, i64 0

                        call i32 @puts(i8* %cast210)
                        ret i32 0
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.ll";
        })
    ];
}