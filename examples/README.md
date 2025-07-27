# Ejemplos de Prueba para VonSim8

Esta carpeta contiene programas de prueba para verificar diferentes funcionalidades del simulador VonSim8.

## Archivos de Prueba

### `test-hlt.asm`
Programa básico que ejecuta la instrucción HLT para detener la CPU.
- **Propósito**: Verificar que la instrucción HLT funciona correctamente
- **Uso**: Cargar en el simulador y ejecutar para ver el comportamiento de detención

### `test-alu-simultaneous.asm`
Programa simple para probar la animación simultánea de left y right en instrucciones ALU.
- **Propósito**: Verificar la nueva funcionalidad de animación simultánea
- **Contenido**: 
  - Carga valores en registros AL y BL
  - Ejecuta `ADD AL, BL` para ver la animación simultánea
- **Uso**: Ejecutar paso a paso para observar la animación simultánea de datos llegando a la ALU

### `test-alu-complete.asm`
Programa completo que prueba múltiples instrucciones ALU con animación simultánea.
- **Propósito**: Verificar el flujo completo de animaciones en instrucciones ALU
- **Contenido**:
  - Carga valores en registros AL, BL, CL
  - Ejecuta `ADD AL, BL` (suma)
  - Ejecuta `SUB CL, BL` (resta)
  - Ejecuta `AND AL, CL` (operación lógica)
- **Uso**: Ejecutar paso a paso para ver el flujo completo de animaciones

## Cómo Usar

1. **Cargar en el simulador**: Abrir el archivo .asm en el editor del simulador
2. **Compilar**: Usar el botón de compilación para verificar que no hay errores
3. **Ejecutar**: Usar los controles de ejecución para ver las animaciones
4. **Observar**: Prestar atención a las animaciones del bus de datos y la ALU

## Funcionalidades Probadas

- **Animación simultánea**: Los datos fluyen simultáneamente a los operandos left y right de la ALU
- **Flujo continuo**: Las animaciones normales continúan después de la animación simultánea
- **Instrucciones ALU**: ADD, SUB, AND, OR, XOR, CMP
- **Registros**: AL, BL, CL, DL
- **Control de flujo**: HLT para detener la ejecución 