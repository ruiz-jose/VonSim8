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
    nombre: "Sumar Si Menor",
    filename: "sumarsimenor.asm",
    contenido: `; Ejemplo: Sumar Si Menor\nx DB 2\ny DB 3\nz DB 0\n          MOV AL, x\n          CMP AL, y\n          JC EsMenor\n          JMP Fin\nEsMenor:  ADD AL, y\n          MOV z, AL\nFin:      HLT`,
  },
  {
    nombre: "Bucle con Condición",
    filename: "bucle_condicion.asm",
    contenido: `; Ejemplo: Bucle que suma números del 1 al 9\nx     db 1\nsuma  DB 0\nCondicion:  CMP x, 10\n            JC Bucle\n            JMP FinBucle\nBucle:      MOV BL, x\n            ADD suma, BL\n            ADD x, 1\n            JMP Condicion\nFinBucle:   hlt`,
  },
  {
    nombre: "Máximo en Vector",
    filename: "maximo_vector.asm",
    contenido: `; Ejemplo: Encontrar el máximo en un vector\nmax     DB 0\nvector  DB 5, 2, 10, 4, 5, 0, 4, 8, 1, 9\n            MOV CL, 0\n            MOV BL, OFFSET vector\nCondicion:  CMP CL, 10\n            JC Bucle\n            JMP FinBucle\nBucle:      MOV AL, [BL]\n            CMP AL, max\n            JC Proximo\n            MOV max, AL\nProximo:    ADD BL, 1\n            ADD CL, 1\n            JMP Condicion\nFinBucle:   HLT`,
  },
  {
    nombre: "Hola Mundo",
    filename: "holamundo.asm",
    contenido: `; Ejemplo: Hola Mundo\ncadena DB "Hola!"\nMOV BL, OFFSET cadena\nMOV AL, 5\nINT 7\nHLT`,
  },
  {
    nombre: "Ingresar Carácter",
    filename: "ingresar_caracter.asm",
    contenido: `; Ejemplo: Ingresar un carácter por teclado\ncar DB 0\nMOV BL, OFFSET car\nINT 6\nHLT`,
  },

];
