# 💾 Ejemplos de Organización de Memoria

Ejemplos que demuestran el uso de directivas de organización de memoria y control de ubicación de código en VonSim8.

## 📁 Archivos

### Directivas ORG
- **[`org-basic.asm`](./org-basic.asm)** - Uso básico de la directiva ORG para ubicar código
- **[`org-20h.asm`](./org-20h.asm)** - Organización de código en la dirección 20h
- **[`org-80h.asm`](./org-80h.asm)** - Ubicación de código en 80h (área de interrupciones)
- **[`org-80h-interrupts.asm`](./org-80h-interrupts.asm)** - ORG 80h combinado con manejo de interrupciones

### Control de Memoria
- **[`memory-control.asm`](./memory-control.asm)** - Control directo de posiciones de memoria
- **[`memory-control-deploy.asm`](./memory-control-deploy.asm)** - Despliegue y organización de memoria para producción

## 🎯 Propósito Educativo

Estos ejemplos están diseñados para:
- Entender cómo organizar el código en memoria
- Aprender el uso de la directiva ORG
- Manejar diferentes segmentos de memoria
- Controlar la ubicación de rutinas críticas
- Optimizar el uso del espacio de memoria

## 🚀 Cómo usar

1. Abrir VonSim8
2. Cargar uno de los archivos `.asm`
3. Observar en el visor de memoria dónde se ubica el código
4. Ejecutar y ver cómo el PC (Program Counter) salta a las direcciones especificadas
5. Experimentar cambiando las direcciones ORG

## 💡 Conceptos clave

- **Directiva ORG**: Define la dirección de inicio del código siguiente
- **Mapa de memoria**: Distribución de diferentes secciones en memoria
- **Vectores de interrupción**: Ubicaciones fijas para rutinas de interrupción
- **Segmentación**: División lógica de la memoria
- **Direccionamiento absoluto**: Referencias a direcciones específicas

## 📍 Direcciones importantes en VonSim8

- **0000h-001Fh**: Vectores de interrupción
- **0020h**: Inicio típico del código de usuario
- **0080h**: Área común para rutinas de servicio
- **FFFFh**: Límite superior de memoria

## ⚠️ Notas importantes

- La directiva ORG no reserva memoria, solo cambia la dirección de ensamblado
- Cuidar no sobrescribir vectores de interrupción importantes
- Verificar que no hay solapamiento de código en memoria
- Considerar el tamaño del código al elegir direcciones ORG