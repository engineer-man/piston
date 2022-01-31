{pkgs, piston, ...}:
let
    # Put your package here, preferibly from nixpkgs.
    pkg = pkgs.openjdk11_headless; # this may be incorrect - it is guessed
in piston.mkRuntime {
    # Name of the language implemented by this runtime
    language = "java";

    # The version of the language
    # Usually this is specified on the package
    version = pkg.version;

    # Name of the runtime
    # This line should be kept if the runtime differs from the language
    runtime = "openjdk11_headless";

    aliases = [
    ];

    # This is the lines of a shell script to evaluate a file at $1
    # The remaining arguments are the arguments to launch the application with
    # The CWD of this script is a temp directory for a job
    #
    # If the compile stage is used, $1 still contains the name of the source file.
    # It is up to your script to determine the filename of the emitted binary
    #
    # No shebang needs to be added to this - that is done automatically.
    run = ''
    mv $1 $1.java
    filename=$1.java
    shift
    ${pkg}/bin/java $filename "$@"
    '';

    # Specify a list of tests.
    # These should output "OK" to STDOUT if everything looks good
    #
    # Run the following command to test the package:
    # $ ./piston test openjdk11_headless-java
    tests = [
        (piston.mkTest {
            files = {
                "test.java" = ''
                    public class HelloWorld {
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
