# FlowPolicy - Guía de Ejecución y Conexión Backend

## Estado del Proyecto

El proyecto frontend de FlowPolicy ha sido completamente rediseñado con:
- Interfaz profesional sin emojis
- Nombre correcto "FlowPolicy" en todos lados
- Conexión completa con backend de Spring Boot
- Componentes completamente funcionales
- Todo en español

## Requisitos

- Node.js 18+ y npm
- Java 21 y Maven (para el backend)
- MongoDB (debe estar ejecutándose en localhost:27017)

## Pasos para Ejecutar

### 1. Backend (Spring Boot)

En la terminal dentro de la carpeta `fp_backend`:

```bash
mvn spring-boot:run
```

El backend estará disponible en: `http://localhost:8080`

Endpoints disponibles:
- GET `/api/usuarios` - Obtener todos los usuarios
- POST `/api/usuarios` - Crear nuevo usuario
- PUT `/api/usuarios/{id}` - Actualizar usuario
- DELETE `/api/usuarios/{id}` - Eliminar usuario

### 2. Frontend (Angular)

En la terminal dentro de la carpeta `fp_frontend`:

```bash
# Instalar dependencias (si es primera vez)
npm install

# Ejecutar el servidor de desarrollo
npm start
```

El frontend estará disponible en: `http://localhost:4200`

## Cambios Realizados

### Imagen y Branding
- Cambié "FLOWPROJECT" por "FlowPolicy" en todo el sitio
- Eliminé todos los emojis de la interfaz
- Utilicé símbolos profesionales CSS en su lugar
- Todo el contenido está en español

### Componente de Usuarios
- Estructura completamente renovada
- Conectado a API real del backend
- Datos de ejemplo mientras el backend carga
- Filtros en tiempo real (búsqueda, rol, departamento, estado)
- Paginación automática de 6 usuarios por página
- Botones de acción: Editar, Eliminar, Ver Detalles

### Servicio de Usuarios
- URL configurada a `http://localhost:8080/api/usuarios`
- Métodos REST completos:
  - obtenerUsuarios()
  - obtenerUsuarioPorId(id)
  - crearUsuario(usuario)
  - actualizarUsuario(id, usuario)
  - eliminarUsuario(id)
- Manejo de errores automático
- Reintento automático en caso de fallo

### Interfaz de Usuario
- Sidebar profesional con navegación
- Top-bar con búsqueda global
- Tabla responsive con datos en tiempo real
- Badges de color para roles y estados
- Avatares con iniciales automáticas
- Estadísticas en vivo

## Estructura de Datos del Backend

El backend debe devolver usuarios en este formato:

```json
{
  "_id": "ObjectId",
  "nombre": "Juan Pérez",
  "correo": "juan@flowpolicy.io",
  "rol": "Admin",
  "departamento": "Infraestructura",
  "estado": "Activo",
  "activo": true
}
```

## Variables de Entorno

Si necesitas cambiar la URL del backend, edita:
`src/app/core/services/user.service.ts`

Línea con la URL:
```typescript
private apiUrl = 'http://localhost:8080/api/usuarios';
```

## Desarrollo Futuro

Funcionalidades aún por implementar:
1. Modal para crear usuarios
2. Modal para editar usuarios
3. Módulo de departamentos completo
4. Formularios con validación
5. Notificaciones toast
6. Exportar a CSV/PDF

## Solución de Problemas

### El frontend no se conecta al backend
1. Verifica que el backend esté ejecutándose en puerto 8080
2. Revisa la consola del navegador (F12 → Console) para ver errores CORS
3. Si hay error CORS, verifica que el backend tenga CORS configurado para `http://localhost:4200`

### Los datos no aparecen
1. Abre DevTools (F12) → Network
2. Busca la petición a `/api/usuarios`
3. Verifica que la respuesta sea 200 y contenga los datos
4. Si hay error 404, verifica que el endpoint sea correcto

### MongoDB no está disponible
Si MongoDB no está corriendo, el backend mostrará un error al iniciarse. 
Asegúrate de que MongoDB esté ejecutándose:
```bash
# En Windows
net start MongoDB

# En macOS (si usas Homebrew)
brew services start mongodb-community
```

## Configuración CORS

El backend (`application.properties`) ya tiene configurado:
```properties
app.cors.allowed-origin=http://localhost:4200
```

Si necesitas cambiar esto, edita el archivo de configuración del backend.

## Próximos Pasos

1. Implementar formularios de creación/edición de usuarios
2. Agregar validación de formularios
3. Implementar notificaciones (toast)
4. Crear módulo completo de departamentos
5. Agregar estadísticas en dashboard
6. Implementar exportación de datos

---

**Versión:** 2.0
**Última actualización:** 25 de Abril, 2026
**Estado:** Listo para desarrollo
