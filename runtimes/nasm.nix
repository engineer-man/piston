{pkgs, piston, ...}:
let
    pkg = pkgs.nasm; 
    binutils = pkgs.binutils;
in piston.mkRuntime {
    language = "nasm";    
    version = pkg.version;

    aliases = [
        "nasm32"
        "asm"
    ];

    compile = ''
        ${pkg}/bin/nasm -f elf32 -o binary.o "$@"
        ${binutils}/bin/ld -m elf_i386 binary.o -o binary
    '';

    run = ''
        shift
        ./binary "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.asm" = ''
                    SECTION .DATA
                    good:     db 'OK',10
                    txtlen:  equ $-good

                    SECTION .TEXT
                    GLOBAL _start

                    _start:
                    mov eax,4
                    mov ebx,1
                    mov ecx,good
                    mov edx,txtlen
                    int 80h
                    mov eax,1
                    mov ebx,0
                    int 80h
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.asm";
        })
    ];
}