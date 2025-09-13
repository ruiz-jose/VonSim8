; Programa simple sin uso del PIC
org 2000h

mov al, 10h
mov bl, 20h
add al, bl
mov [3000h], al

hlt

end
