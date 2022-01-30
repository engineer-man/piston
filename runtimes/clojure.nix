{pkgs, piston, ...}:
let
    pkg = pkgs.clojure;
in piston.mkRuntime {
    language = "clojure";
    version = pkg.version + ""; #Clojure has X.X.X.X versioning, we want X.X.X

    aliases = [
        "clj"
    ];

    run = ''
    ${pkg}/bin/clojure "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.clj" = ''
                    (ns clojure.examples.main
                        (:gen-class))
                    (defn main []
                        (println "OK"))
                    (main)
                '';
            };
        })
    ];
}