# Tour de Bienvenida - VonSim8

## Descripción

El tour de bienvenida es una funcionalidad interactiva que guía a los usuarios a través de las características principales de VonSim8. Se activa haciendo clic en el botón de interrogación (❓) en la barra de navegación.

## Funcionamiento

### Elementos del Tour

El tour busca los siguientes elementos en la interfaz usando `data-testid`:

| Elemento           | Componente   | Descripción                           |
| ------------------ | ------------ | ------------------------------------- |
| `app-container`    | App.tsx      | Contenedor principal de la aplicación |
| `header`           | Header.tsx   | Barra de navegación superior          |
| `controls`         | Controls.tsx | Controles de simulación               |
| `panel-editor`     | App.tsx      | Panel del editor de código            |
| `panel-computer`   | App.tsx      | Panel del simulador de computadora    |
| `cpu-component`    | CPU.tsx      | Componente de la CPU                  |
| `memory-component` | Memory.tsx   | Componente de memoria RAM             |
| `settings-button`  | Header.tsx   | Botón de configuración                |
| `panel-settings`   | App.tsx      | Panel de configuración                |
| `footer-links`     | Footer.tsx   | Enlaces del pie de página             |
| `cycle-button`     | Controls.tsx | Botón de ejecución por ciclo          |

### Pasos del Tour

1. **Bienvenida** - Introducción general a VonSim8
2. **Barra de Navegación** - Explicación del header
3. **Controles de Simulación** - Botones de control de la simulación
4. **Editor de Código** - Panel donde escribir código ensamblador
5. **Simulador de Computadora** - Vista de la computadora virtual
6. **Arquitectura CPU** - Componente de la CPU
7. **Memoria RAM** - Componente de memoria
8. **Botón de Configuración** - Acceso a configuraciones
9. **Panel de Configuración** - Opciones de configuración
10. **Recursos y Soporte** - Enlaces útiles
11. **Final** - Conclusión del tour

## Características Técnicas

### Detección de Elementos

- El tour verifica que cada elemento esté presente antes de mostrar el tooltip
- Usa un timeout de 100ms para elementos que se renderizan dinámicamente
- Si un elemento no se encuentra, muestra un mensaje de error informativo

### Navegación

- **Flechas**: Usar las flechas del teclado para navegar
- **Escape**: Cerrar el tour
- **Botones**: Navegación visual con botones Anterior/Siguiente

### Persistencia

- El estado de completado se guarda en `localStorage`
- El tour no se inicia automáticamente después de completarlo
- Se puede reiniciar haciendo clic en el botón del tour

## Mantenimiento

### Verificación de Elementos

Para verificar que todos los elementos del tour están correctamente configurados:

```bash
pnpm verify-tour
```

Este comando verifica que todos los `data-testid` necesarios estén presentes en los archivos correspondientes.

### Agregar Nuevos Pasos

Para agregar un nuevo paso al tour:

1. Agregar el paso en el array `tourSteps` en `WelcomeTour.tsx`
2. Asegurar que el `target` coincida con un `data-testid` existente
3. Ejecutar `pnpm verify-tour` para verificar

### Ejemplo de Nuevo Paso

```typescript
{
  id: "nuevo-paso",
  target: "mi-componente",
  title: "Mi Nuevo Paso",
  content: "Descripción del nuevo paso...",
  icon: "icon-[lucide--icon]",
  position: "bottom",
}
```

## Solución de Problemas

### Elemento no encontrado

Si el tour muestra "Elemento no encontrado":

1. Verificar que el `data-testid` existe en el componente correspondiente
2. Ejecutar `pnpm verify-tour` para identificar elementos faltantes
3. Asegurar que el componente esté renderizado cuando el tour lo busca

### Tour no se inicia

1. Verificar que el botón del tour esté presente en el header
2. Revisar la consola del navegador para errores
3. Limpiar `localStorage` si es necesario

## Archivos Relacionados

- `app/src/components/WelcomeTour.tsx` - Componente principal del tour
- `app/src/components/Header.tsx` - Botón para iniciar el tour
- `app/scripts/verify-tour-elements.js` - Script de verificación
- `app/docs/TOUR.md` - Esta documentación
