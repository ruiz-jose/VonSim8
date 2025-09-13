# 🔄 Ejemplos de Control de Flujo

Ejemplos que demuestran instrucciones de control de flujo, saltos condicionales y control de ejecución en VonSim8.

## 📁 Archivos

### Saltos y Condicionales
- **[`jump-conditional.asm`](./jump-conditional.asm)** - Demostración de saltos condicionales (JZ, JNZ, JC, JNC, etc.)
- **[`sequencer.asm`](./sequencer.asm)** - Control del secuenciador de instrucciones

### Control de Ejecución
- **[`halt-instruction.asm`](./halt-instruction.asm)** - Uso de la instrucción HLT para detener ejecución
- **[`halt-fix.asm`](./halt-fix.asm)** - Ejemplo corregido del manejo de HLT

## 🎯 Propósito Educativo

Estos ejemplos están diseñados para:
- Entender las instrucciones de salto condicional
- Aprender el control de flujo de programas
- Manejar la instrucción HALT correctamente
- Implementar bucles y estructuras de control
- Usar flags para tomar decisiones

## 🚀 Cómo usar

1. Abrir VonSim8
2. Cargar uno de los archivos `.asm`
3. Ejecutar paso a paso para ver cómo cambia el flujo
4. Observar el registro de flags y cómo afecta los saltos
5. Experimentar modificando condiciones

## 💡 Conceptos clave

- **Saltos condicionales**: JZ, JNZ, JC, JNC, JS, JNS, JO, JNO
- **Saltos incondicionales**: JMP
- **Flags de condición**: Zero (Z), Carry (C), Sign (S), Overflow (O)
- **Bucles**: Implementación usando saltos condicionales
- **Control de programa**: Gestión del Program Counter (PC)

## 🔧 Instrucciones principales

### Saltos Condicionales
- `JZ label` - Salta si Zero flag está activo
- `JNZ label` - Salta si Zero flag no está activo
- `JC label` - Salta si Carry flag está activo
- `JNC label` - Salta si Carry flag no está activo
- `JS label` - Salta si Sign flag está activo
- `JNS label` - Salta si Sign flag no está activo

### Control de Ejecución
- `JMP label` - Salto incondicional
- `HLT` - Detiene la ejecución
- `NOP` - No operación (continúa)

## ⚠️ Notas importantes

- Los saltos condicionales dependen del estado de los flags
- HLT detiene completamente el procesador
- Cuidar los bucles infinitos
- Verificar que las etiquetas estén correctamente definidas