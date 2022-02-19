{pkgs, piston, ...}:
let
    pkg = pkgs.kotlin;
    jre = pkgs.jre;
in piston.mkRuntime {
    language = "kotlin";
    version = pkg.version;
    runtime = "jvm";

    aliases = [
        "kt"
    ];

    compile = ''
        rename 's/$/\.kt/' "$@" # Add .kt extension
        ${pkg}/bin/kotlinc *.kt -include-runtime -d code.jar
    '';

    run = ''
        shift
        ${jre}/bin/java -jar code.jar "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.kt" = ''
                    fun main() {
                        println("OK")
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.kt";
        })
    ];
}