
- Después de realizar cambios, SIEMPRE asegúrese de iniciar un nuevo servidor para que pueda probarlo.
- Busque siempre código existente para iterar en lugar de crear código nuevo.
- No cambie drásticamente los patrones antes de intentar iterar sobre patrones existentes.
- Siempre elimine todos los servidores relacionados existentes que puedan haberse creado en pruebas anteriores antes de intentar iniciar un nuevo servidor.
- Prefiere siempre soluciones sencillas
- Evite la duplicación de código siempre que sea posible, lo que significa verificar otras áreas de la base de código que ya puedan tener código y funcionalidad similares.
- Escribir código que tenga en cuenta los diferentes entornos: desarrollo, prueba y producción.
- Tiene cuidado de realizar únicamente los cambios que se solicitan o que está seguro de que se entienden bien y están relacionados con el cambio solicitado.
Al corregir un problema o error, no introduzca un nuevo patrón o tecnología sin antes agotar todas las opciones de la implementación existente. Si finalmente lo hace, asegúrese de eliminar la implementación anterior posteriormente para evitar la duplicación de lógica.
- Mantener la base de código muy limpia y organizada
- Evite escribir scripts en archivos si es posible, especialmente si es probable que el script solo se ejecute una vez.
Evite tener archivos con más de 200-300 líneas de código. Refactorice en ese punto.
- Los datos simulados solo son necesarios para las pruebas, nunca los datos simulados para desarrollo o producción.
- Nunca agregue stubbing o patrones de datos falsos al código que afecten los entornos de desarrollo o producción
- Nunca sobrescriba mi archivo .env sin antes preguntar y confirmar
- Centrarse en las áreas de código relevantes para la tarea
- No toque el código que no esté relacionado con la tarea.
- Escribir pruebas exhaustivas para todas las funcionalidades principales
- Evite realizar cambios importantes en los patrones y la arquitectura de cómo funciona una característica, después de que haya demostrado funcionar bien, a menos que se indique explícitamente.
- Piense siempre en qué otros métodos y áreas del código podrían verse afectados por los cambios de código.