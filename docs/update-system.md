# Sistema de Actualizaciones de VonSim8

## Descripción General

VonSim8 implementa un sistema robusto de detección y gestión de actualizaciones que combina múltiples técnicas para asegurar que los usuarios siempre tengan la versión más reciente de la aplicación.

## Componentes del Sistema

### 1. Service Worker (PWA)
- **Archivo**: `app/src/hooks/usePWAUpdate.ts`
- **Tecnología**: `vite-plugin-pwa` + `workbox-window`
- **Funcionalidad**: 
  - Detecta automáticamente cuando hay una nueva versión del Service Worker
  - Permite actualizaciones sin recargar la página
  - Maneja el caché de recursos estáticos

### 2. Verificación por Hash de Commit
- **Archivo**: `app/src/hooks/useVersionCheck.ts`
- **Tecnología**: Hash del commit Git + localStorage
- **Funcionalidad**:
  - Compara el hash del commit actual con el anterior
  - Detecta cambios en el código fuente
  - Funciona incluso sin Service Worker

### 3. Sistema de Notificaciones
- **Archivo**: `app/src/components/NotificationCenter.tsx`
- **Funcionalidad**:
  - Notificaciones persistentes en localStorage
  - Botones de acción para actualizar
  - Diferentes tipos de notificaciones (info, success, warning, error)

### 4. Banner de Actualización
- **Archivo**: `app/src/components/UpdateBanner.tsx`
- **Funcionalidad**:
  - Banner prominente en la parte superior
  - Botón de actualización directo
  - Opción de descartar temporalmente

### 5. Configuración de Actualizaciones
- **Archivo**: `app/src/components/UpdateSettings.tsx`
- **Funcionalidad**:
  - Control de verificación automática
  - Configuración de intervalos
  - Estado actual del sistema

## Flujo de Actualización

### 1. Detección Automática
```typescript
// Verificación cada 30 minutos (PWA)
const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

// Verificación cada 5 minutos (Hash)
const interval = setInterval(checkForVersionUpdate, 5 * 60 * 1000);
```

### 2. Eventos de Activación
- **Página visible**: Cuando el usuario regresa a la pestaña
- **Conexión online**: Cuando se restaura la conexión a internet
- **Verificación manual**: Botón en configuración

### 3. Notificación al Usuario
1. **Notificación en el centro**: Aparece en el icono de campana
2. **Banner prominente**: Banner en la parte superior
3. **Toast opcional**: Notificación temporal

### 4. Proceso de Actualización
```typescript
// Para PWA
await updateApp(); // Actualiza Service Worker

// Para Hash
updateToNewVersion(); // Recarga la página
```

## Configuración

### Variables de Entorno
```typescript
// En vite.config.ts
define: {
  __COMMIT_HASH__: JSON.stringify(getCommitHash()),
}
```

### Configuración del Usuario
```typescript
interface UpdateSettings {
  autoCheck: boolean;        // Verificación automática
  showBanner: boolean;       // Mostrar banner
  showNotifications: boolean; // Mostrar notificaciones
  checkInterval: number;     // Intervalo en minutos
}
```

## Almacenamiento Local

### Claves Utilizadas
- `vonsim8-commit-hash`: Hash del último commit conocido
- `vonsim8-notifications`: Notificaciones persistentes
- `vonsim8-update-settings`: Configuración del usuario

## API Pública

### Funciones Globales
```typescript
// Actualizar aplicación
window.updateVonSim8();

// Verificar actualizaciones manualmente
window.checkVonSim8Updates();

// Agregar notificación
window.VonSimAddNotification(notification);
```

### Hooks Disponibles
```typescript
// Hook principal de PWA
const { updateInfo, updateApp, checkForUpdates } = usePWAUpdate();

// Hook de verificación de versión
const { versionInfo, updateToNewVersion, dismissUpdate } = useVersionCheck();
```

## Casos de Uso

### 1. Desarrollo Local
- Las actualizaciones se detectan automáticamente
- El Service Worker se registra en modo desarrollo
- Los hashes se comparan para detectar cambios

### 2. Producción
- Service Worker activo con caché optimizado
- Verificación periódica de actualizaciones
- Notificaciones automáticas al usuario

### 3. Modo Offline
- La aplicación funciona sin conexión
- Las actualizaciones se detectan cuando vuelve la conexión
- Notificación de "modo offline disponible"

## Mejores Prácticas

### 1. Experiencia del Usuario
- No interrumpir el trabajo del usuario
- Proporcionar opciones claras (actualizar/descartar)
- Mostrar progreso durante la actualización

### 2. Rendimiento
- Verificaciones no bloqueantes
- Intervalos razonables para no saturar el servidor
- Caché inteligente de recursos

### 3. Confiabilidad
- Múltiples métodos de detección
- Fallbacks para diferentes escenarios
- Manejo de errores robusto

## Solución de Problemas

### Problemas Comunes

1. **No se detectan actualizaciones**
   - Verificar que el Service Worker esté registrado
   - Comprobar que el hash del commit se esté generando
   - Revisar la configuración del usuario

2. **Actualizaciones no se aplican**
   - Verificar permisos del navegador
   - Comprobar que no haya errores en la consola
   - Forzar recarga manual si es necesario

3. **Notificaciones no aparecen**
   - Verificar que el NotificationProvider esté activo
   - Comprobar la configuración de notificaciones
   - Revisar el localStorage

### Debugging
```typescript
// Habilitar logs detallados
console.log("PWA Update Info:", updateInfo);
console.log("Version Info:", versionInfo);
console.log("Update Settings:", settings);
```

## Futuras Mejoras

1. **Actualización en segundo plano**: Descargar actualizaciones sin interrumpir al usuario
2. **Rollback automático**: Revertir a versión anterior si hay problemas
3. **Notificaciones push**: Avisar sobre actualizaciones críticas
4. **Analytics**: Seguimiento de adopción de actualizaciones
5. **A/B Testing**: Probar nuevas versiones con subconjuntos de usuarios 