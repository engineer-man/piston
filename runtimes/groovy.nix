{pkgs, piston, ...}:
let
    pkg = pkgs.groovy;
    jre = pkgs.jre;
    awk = pkgs.gawk;
    sed = pkgs.gnused;
    grep = pkgs.gnugrep;
in piston.mkRuntime {
    language = "groovy";
    version = pkg.version;

    aliases = [
        "gvy"
    ];

    compile = ''
        # Groovyc has some dependencies on GNU grep, sed, and awk in their startup script
        export PATH="$PATH:${awk}/bin:${sed}/bin:${grep}/bin"

        # Compile groovy scripts into a separate "classes" directory
        # NOTE: - Main file MUST be a groovy script 
        #       - not supporting object class entry points as of now
        ${pkg}/bin/groovyc -d classes "$@"

        # Create the Manifest and include groovy jars:
        # NOTE: - main class will be the first file ('.' becomes '_' and without the extension)
        #       - groovy lib jars MUST be in the class path in order to work properly
        echo "Main-Class: $(sed 's/\./\_/g'<<<''${1%.*})
        Class-Path:  $(echo ${pkg}/lib/*.jar | sed 's/\s/\n  /g')

        " > manifest.txt

        # Create the jar from the manifest and classes
        ${jre}/bin/jar cfm out.jar manifest.txt -C classes .
    '';

    run = ''
        shift
        ${jre}/bin/java -jar out.jar "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.groovy" = ''
                    println 'OK'
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.groovy";
        })
    ];
}