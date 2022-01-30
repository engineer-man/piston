{pkgs, piston, ...}:
let
    # Put your package here, preferibly from nixpkgs.
    pkg = pkgs.%RUNTIME%; # this may be incorrect - it is guessed
in piston.mkRuntime {
    # Name of the language implemented by this runtime
    language = "%LANGUAGE%";
    
    # The version of the language
    # Usually this is specified on the package
    version = pkg.version;

    # Name of the runtime
    # This line should be kept if the runtime differs from the language
    runtime = "%RUNTIME%";

    aliases = [
        # Put extensions in here, and other common names
        # Example:
        # "js"
        # "node-javascript"
    ];



    # This is the lines of a shell script to compile source code.
    # Arguments passed to this script are all the provided source files
    # The CWD of this script is a temp directory for a job
    #
    # If the language only supports JIT compiling, simply remove this line
    # See ./python3.nix and ./node-javascript.nix for examples
    #
    # No shebang needs to be added to this - that is done automatically.
    compile = ''
    ${pkg}/bin/%RUNTIME% --compile "$@"
    '';

    # This is the lines of a shell script to evaluate a file at $1
    # The remaining arguments are the arguments to launch the application with
    # The CWD of this script is a temp directory for a job
    #
    # If the compile stage is used, $1 still contains the name of the source file.
    # It is up to your script to determine the filename of the emitted binary
    #
    # No shebang needs to be added to this - that is done automatically.
    run = ''
    ${pkg}/bin/%RUNTIME% "$@"
    '';

    # Specify a list of tests.
    # These should output "OK" to STDOUT if everything looks good
    tests = [
        (piston.mkTest {
            files = {
                "test.js" = ''
                    console.log("OK");
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.js";
        })
    ];
}