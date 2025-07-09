; ¡Bienvenido a VonSim 8!
; Este es un ejemplo de código que suma dos variables z = x + y      
  x  db 3
  y  db 2
  z  db 0
  mov al, x
  add al, y
  mov z, al
  hlt