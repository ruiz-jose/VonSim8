# 🔔 Ejemplos de Interrupciones

Ejemplos que demuestran el funcionamiento del Controlador de Interrupciones Programable (PIC) y el manejo de interrupciones en VonSim8.

## 📁 Archivos

### Básicos
- **[`pic-basic.asm`](./pic-basic.asm)** - Ejemplo básico de configuración y uso del PIC
- **[`pic-simple.asm`](./pic-simple.asm)** - Implementación simple de interrupciones
- **[`pic-minimal.asm`](./pic-minimal.asm)** - Configuración mínima del PIC

### Configuración y Detección
- **[`pic-detection.asm`](./pic-detection.asm)** - Detección automática del PIC en el sistema
- **[`pic-activation.asm`](./pic-activation.asm)** - Activación manual del PIC
- **[`pic-auto-activation.asm`](./pic-auto-activation.asm)** - Activación automática del PIC

### Avanzados
- **[`pic-complete-demo.asm`](./pic-complete-demo.asm)** - Demostración completa de todas las funcionalidades del PIC
- **[`pic-vector.asm`](./pic-vector.asm)** - Manejo de vectores de interrupción
- **[`pic-handshake.asm`](./pic-handshake.asm)** - Protocolo de handshake con dispositivos externos
- **[`pic-with-flags.asm`](./pic-with-flags.asm)** - Uso de flags de interrupción
- **[`pic-constants.asm`](./pic-constants.asm)** - Definición y uso de constantes del PIC

### Especializados
- **[`keyboard-int6.asm`](./keyboard-int6.asm)** - Manejo de interrupción de teclado (INT6)
- **[`pic-usage.asm`](./pic-usage.asm)** - Casos de uso comunes del PIC
- **[`pic-con.asm`](./pic-con.asm)** - PIC con configuración específica
- **[`pic-sin.asm`](./pic-sin.asm)** - PIC sin configuraciones adicionales

## 🎯 Propósito Educativo

Estos ejemplos están diseñados para:
- Entender el funcionamiento del sistema de interrupciones
- Aprender a configurar el PIC correctamente
- Manejar diferentes tipos de interrupciones
- Implementar rutinas de servicio de interrupción (ISR)
- Practicar protocolos de comunicación con dispositivos

## 🚀 Cómo usar

1. Abrir VonSim8
2. Cargar uno de los archivos `.asm`
3. Configurar los dispositivos de entrada si es necesario
4. Ejecutar y observar cómo se manejan las interrupciones
5. Experimentar generando interrupciones manualmente

## 💡 Conceptos clave

- **PIC (Programmable Interrupt Controller)**: Controlador de interrupciones
- **ISR (Interrupt Service Routine)**: Rutina de servicio de interrupción
- **Vector de Interrupción**: Dirección de la rutina de manejo
- **Máscaras de Interrupción**: Control de qué interrupciones están habilitadas
- **Prioridades**: Orden de atención de interrupciones
- **Handshake**: Protocolo de confirmación de recepción

## ⚠️ Notas importantes

- Siempre guardar el contexto (registros) al entrar en una ISR
- Restaurar el contexto antes de salir de la ISR
- Usar `IRET` para retornar de una interrupción
- Configurar correctamente las máscaras del PIC