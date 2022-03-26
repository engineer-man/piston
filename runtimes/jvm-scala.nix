{pkgs, piston, ...}:
let
    pkg = pkgs.scala;
    java = pkgs.jdk8;
    sed = pkgs.gnused;
in piston.mkRuntime {
    language = "scala";
    version = pkg.version;
    runtime = "jvm";

    aliases = [
        "sc"
    ];

    compile = ''
        # Compile scala classes into a jar file
        ${pkg}/bin/scalac "$@" -d out.jar

        # Capture extra class-path libraries
        java_libs="$(echo ${java}/lib/openjdk/lib/*.jar | ${sed}/bin/sed 's/\s/\\n  /g')"
        scala_libs="$(echo ${pkg}/lib/*.jar | ${sed}/bin/sed 's/\s/\\n  /g')"

        echo -e "Class-Path:  $java_libs
          $scala_libs
        " > classPath

        # Update the jar manifest with scala libs
        ${java}/bin/jar umf classPath out.jar
    '';

    run = ''
        # Run jar from compile
        shift
        ${java}/bin/java -jar out.jar "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.sc" = ''
                    object Main {
                        def main(args: Array[String]) = {
                            println("OK")
                        }
                    }
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.sc";
        })
    ];
}