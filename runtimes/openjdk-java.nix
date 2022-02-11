{pkgs, piston, ...}:
let
    pkg = pkgs.openjdk;
in piston.mkRuntime {
    language = "java";
    version = pkg.version;
    runtime = "openjdk";
    aliases = [];

    run = ''
        mv $1 $1.java
        filename=$1.java
        shift
        ${pkg}/bin/java $filename "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.java" = ''
                    public class PrinOK {
                        public static void main(String[] args) {
                            System.out.println("OK");
                        }
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.java";
        })
    ];
}