export default function piston(): PistonClient

export interface PistonClient {
  runtimes(): Promise<Result | Runtime[]>;

  execute(language: language, code: string, options?: ExecutionOptions): Promise<Result | ExecutionResult>;
}

export interface ExecutionResult {
  language: language;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: any;
    output: string
  }
}

export interface ExecutionOptions {
  language: language;
  version: string;
  files: {
    name: string;
    content: string;
  }[]
  stdin: string;
  args: string[];
  compile_timeout: number;
  run_timeout: number;
  compile_memory_limit: number;
  run_memory_limit: number;
}

export interface Runtime {
  language: language;
  version: string;
  aliases: string[]
}

export type Result = any | { error: any, success: boolean } | undefined;

export type language = "awk" | "bash" | "befunge93" | "brachylog" | "brainfuck" | "bqn" | "c" | "c++" | "cjam" | "clojure" | "cobol" | "coffeescript" | "cow" | "crystal" | "csharp" | "csharp.net" | "d" | "dart" | "dash" | "dragon" | "elixir" | "emacs" | "emojicode" | "erlang" | "file" | "forte" | "forth" | "fortran" | "freebasic" | "fsharp.net" | "fsi" | "go" | "golfscript" | "groovy" | "haskell" | "husk" | "iverilog" | "japt" | "java" | "javascript" | "jelly" | "julia" | "kotlin" | "lisp" | "llvm_ir" | "lolcode" | "lua" | "matl" | "nasm" | "nasm64" | "nim" | "ocaml" | "octave" | "osabie" | "paradoc" | "pascal" | "perl" | "php" | "ponylang" | "powershell" | "prolog" | "pure" | "pyth" | "python" | "python2" | "racket" | "raku" | "retina" | "rockstar" | "rscript" | "ruby" | "rust" | "samarium" | "scala" | "smalltalk" | "sqlite3" | "swift" | "typescript" | "basic" | "basic.net" | "vlang" | "vyxal" | "yeethon" | "zig";