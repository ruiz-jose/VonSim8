// Ejemplos de programas para VonSim
export const ejemplos = [
  {
    nombre: "Sumador simple",
    filename: "sumador.asm",
    contenido: `; Ejemplo: Sumador simple z = x + y\nx DB 3\ny DB 2\nz DB 0\nMOV AL, x\nADD AL, y\nMOV z, AL\nHLT`,
  },
  {
    nombre: "Sumar Si Iguales",
    filename: "sumarsiiguales.asm",
    contenido: `; Ejemplo: Sumar Si Iguales x = y\nx DB 1\ny DB 2\nz DB 0\n         mov al, x\n         sub al, y\n         jz EsIgual\n         jmp Fin\nEsIgual: mov dl, x\n         add y, dl\nFin:     hlt`,
  },
  {
    nombre: "Hola Mundo",
    filename: "holamundo.asm",
    contenido: `; Ejemplo: Hola Mundo\ncadena db "Hola!"\nmov BL, offset cadena\nmov AL, 5\nint 7\nHLT`,
  },
];
