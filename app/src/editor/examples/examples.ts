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
  {
    nombre: "Control de LEDs",
    filename: "control_leds.asm",
    contenido: `; Enciende las luces (una sí, una no): 1010 1010b\n; 31h = PB --> puerto de datos para las luces (LEDs)\n; 33h = CB --> puerto de control para las luces\n\n; Configura todos los bits de PB como salida para controlar las luces\nMOV AL, 0                ; 0000 0000b: todos los bits de PB en modo salida\nOUT 33h, AL              ; Escribe en CB para configurar PB como salida\n\n; Enciende las luces alternadas: 1010 1010b (170 decimal)\nMOV AL, 170              ; 1010 1010b: enciende LEDs pares, apaga impares\nOUT 31h, AL              ; Escribe el valor en PB para actualizar las luces\n\nHLT`,
  },
  {
    nombre: "Leer Contraseña",
    filename: "leer_contrasena.asm",
    contenido: `; Leer el valor de interruptores como una contraseña hasta que el usuario la adivine
clave DB 15               ; Contraseña esperada: 00001111 (en decimal 15)
mensaje_ok DB "Bienvenido!" ; Mensaje a mostrar si la contraseña es correcta

; Configurar PA (Puerto A) como entrada
MOV AL, 15                ; 00001111b: configura los primeros 4 bits de PA como entrada
OUT 32h, AL               ; Escribe en CA para configurar PA

bucle:
    IN AL, 30h            ; Lee el valor actual de las llaves desde PA
    CMP AL, clave         ; Compara el valor leído con la contraseña
    JZ Mostrar_Mensaje    ; Si coincide, salta a Mostrar_Mensaje
    JMP bucle             ; Si no coincide, vuelve a intentar

Mostrar_Mensaje:
    MOV BL, OFFSET mensaje_ok ; BL apunta al mensaje de éxito
    MOV AL, 11                ; Longitud del mensaje (Bienvenido! tiene 11 caracteres)
    INT 7
    HLT`
  },
];
