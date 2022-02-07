{pkgs, piston, ...}:
let
    pkg = pkgs.nasm; 
    binutils = pkgs.binutils;
in piston.mkRuntime {
    language = "nasm64";
    version = pkg.version;
    runtime = "nasm";

    aliases = [
        "asm64"
    ];

    compile = ''
        ${pkg}/bin/nasm -f elf64 -o binary.o "$@"
        ${binutils}/bin/ld -m elf_x86_64 binary.o -o binary
    '';

    run = ''
        shift
        ./binary "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.asm64" = ''
                    SECTION .data
                        good:   db "OK", 10
                        txtlen:	equ $ - good

                    SECTION .text
                    GLOBAL _start

                    _start:
                        ;sys_write
                        mov rax, 1
                        mov rdi, 1
                        mov rsi, good
                        mov rdx, txtlen
                        syscall
                        ;sys_exit
                        mov rax, 60
                        mov rdi, 0
                        syscall
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.asm64";
        })
    ];
}