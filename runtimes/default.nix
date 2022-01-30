args: {
    "node-javascript" = import ./node-javascript.nix args;
    "python2" = import ./python2.nix args;
    "python3" = import ./python3.nix args;
    "bash" = import ./bash.nix args;
    "clojure" = import ./clojure.nix args;
    "cobol-gnu-cobol" = import ./cobol-gnu-cobol.nix args;
}
