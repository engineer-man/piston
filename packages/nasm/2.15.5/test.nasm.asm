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