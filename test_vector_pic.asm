; Programa simple que usa PIC - para probar vector de interrupciones
IMR EQU 21h

mov al, 0FFh
out IMR, al
hlt
