SECTION .data
    good:	db "good", 0x0
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
