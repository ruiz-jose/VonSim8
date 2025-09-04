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
    contenido: `; Ejemplo: Sumar Si Iguales x = y\nx DB 1\ny DB 2\nz DB 0\n         MOV AL, x\n         SUB AL, y\n         JZ EsIgual\n         JMP Fin\nEsIgual: MOV DL, x\n         ADD y, DL\nFin:     HLT`,
  },
  {
    nombre: "Hola Mundo",
    filename: "holamundo.asm",
    contenido: `; Ejemplo: Hola Mundo\ncadena DB "Hola!"\nMOV BL, offset cadena\nMOV AL, 5\nINT 7\nHLT`,
  },
  {
    nombre: "Ingresar Carácter",
    filename: "ingresar_caracter.asm",
    contenido: `; Ejemplo: Ingresar un carácter por teclado\ncar DB 0\nMOV BL, offset car\nINT 6\nHLT`,
  },
];
