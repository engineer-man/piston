args: {
    "node-javascript" = import ./node-javascript.nix args;
    "python2" = import ./python2.nix args;
    "python3" = import ./python3.nix args;
    "bash" = import ./bash.nix args;
    "clojure" = import ./clojure.nix args;
    "cobol-gnu-cobol" = import ./cobol-gnu-cobol.nix args;
    "crystal" = import ./crystal.nix args;
    "dart" = import ./dart.nix args;
    "dash" = import ./dash.nix args;
    "deno-javascript" = import ./deno-javascript.nix args;
    "deno-typescript" = import ./deno-typescript.nix args;
    "elixir" = import ./elixir.nix args;
    "erlang" = import ./erlang.nix args;
    "gawk-awk" = import ./gawk-awk.nix args;
    "openjdk11_headless-java" = import ./openjdk11_headless-java.nix args;
    "ruby" = import ./ruby.nix args;
    "zig" = import ./zig.nix args;
    "vlang" = import ./vlang.nix args;
    "swift" = import ./swift.nix args;
    "node-typescript" = import ./node-typescript.nix args;
    "sqlite3" = import ./sqlite3.nix args;
    "rscript" = import ./rscript.nix args;
    "raku" = import ./raku.nix args;
}
