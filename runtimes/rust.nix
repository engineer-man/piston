{pkgs, piston, ...}:
let
    gccPackage = pkgs.gcc;  # gcc is required for the linker
    pkg = pkgs.rustc;
in piston.mkRuntime {
    language = "rust";
    version = pkg.version;

    aliases = [
        "rs"
    ];

    compile = ''
        ${pkg}/bin/rustc -o binary -C linker=${gccPackage}/bin/gcc $1
        chmod +x binary
    '';

    run = ''
        shift
        ./binary "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.rs" = ''
                    pub mod helper;
                    use std::env;

                    fn main() {
                        let args: Vec<String> = env::args().collect();
                        helper::print_something(args[1].to_string());
                    }
                '';
                "helper.rs" = ''
                    pub fn print_something(what: String) -> () {
                        println!("{}", what);
                    }
                '';
            };
            args = ["OK"];
            stdin = "";
            packages = [];
            main = "test.rs";
        })
    ];
}
