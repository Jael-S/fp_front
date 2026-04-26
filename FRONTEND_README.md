# Sistema FlowPolicy - Frontend

## Descripción

Frontend moderno y responsive para la gestión de usuarios y departamentos de FlowPolicy, construido con Angular 18+.

## Características

### 🎨 Diseño Moderno
- Interfaz oscura profesional con gradientes azules
- Totalmente responsive para dispositivos móviles
- Transiciones y animaciones suaves
- Tema consistente basado en colores corporativos

### 📊 Módulos Principales

#### 1. **Gestión de Usuarios** (`/usuarios`)
- Tabla interactiva de usuarios con búsqueda y filtros
- Filtros por rol, departamento y estado
- Paginación integrada
- Estadísticas en tiempo real
- Acciones: Editar, eliminar, más opciones
- Badges de estado con indicadores visuales

#### 2. **Gestión de Departamentos** (`/departamentos`)
- Tabla de departamentos con información completa
- Búsqueda por nombre o descripción
- Filtros por estado
- Estadísticas agregadas
- Control de usuarios por departamento

#### 3. **Dashboard** (`/dashboard`)
- Panel de control con acceso rápido a módulos
- Cards interactivas con estadísticas
- Métricas rápidas del sistema
- Navegación intuitiva

## Estructura del Proyecto

```
src/
├── app/
│   ├── app.component.* (Layout principal - Sidebar + Header + Content)
│   ├── app.routes.ts (Rutas de la aplicación)
│   ├── app.config.ts (Configuración de Angular)
│   ├── core/
│   │   ├── auth/ (Guards y interceptores)
│   │   └── services/
│   │       ├── user.service.ts
│   │       └── department.service.ts
│   └── modules/
│       ├── dashboard/
│       │   ├── dashboard.component.html
│       │   ├── dashboard.component.ts
│       │   └── dashboard.component.css
│       ├── users/
│       │   ├── users.component.html
│       │   ├── users.component.ts
│       │   └── users.component.css
│       └── departments/
│           ├── departments.component.html
│           ├── departments.component.ts
│           └── departments.component.css
├── styles/
│   ├── styles.css (Estilos globales)
│   ├── _reset.scss (Reset y normalize)
│   └── _variables.scss (Variables CSS)
└── index.html
```

## Componentes

### AppComponent
**Propósito**: Layout principal de la aplicación
- Sidebar con navegación
- Header con búsqueda y opciones de usuario
- Router outlet para contenido dinámico

### DashboardComponent
**Propósito**: Panel de control principal
- Acceso rápido a módulos
- Estadísticas generales
- Cards interactivas

### UsersComponent
**Propósito**: Gestión completa de usuarios
- Tabla con datos de usuarios
- Búsqueda y filtros avanzados
- Paginación
- CRUD básico (Editar, eliminar)
- Estadísticas de usuarios

**Características**:
- Búsqueda por nombre o email
- Filtro por rol (Admin, User, Editor)
- Filtro por departamento
- Filtro por estado (Active, Inactive, Blocked)
- 6 registros por página
- Iconos y badges de estado

### DepartmentsComponent
**Propósito**: Gestión de departamentos
- Tabla de departamentos con información completa
- Búsqueda por nombre o descripción
- Filtros por estado
- CRUD básico
- Estadísticas de departamentos

## Estilos

### Paleta de Colores
```css
--primary-color: #00a8ff;      /* Azul principal */
--primary-dark: #0085cc;       /* Azul oscuro */
--bg-dark: #0a0e27;            /* Fondo oscuro */
--bg-card: #141829;            /* Fondo tarjetas */
--bg-hover: #1a1f3a;           /* Hover background */
--text-primary: #ffffff;       /* Texto principal */
--text-secondary: #a0aec0;     /* Texto secundario */
--border-color: #2d3748;       /* Bordes */
--success-color: #48bb78;      /* Verde éxito */
--warning-color: #ed8936;      /* Naranja advertencia */
--danger-color: #f56565;       /* Rojo peligro */
--info-color: #4299e1;         /* Azul información */
```

### Clases de Utilidad
- `.btn-primary`: Botón principal con gradiente
- `.btn-icon`: Botones pequeños para acciones
- `.status-badge`: Badges de estado con colores
- `.role-badge`: Badges para roles de usuario
- `.stat-card`: Tarjetas de estadísticas

## Rutas Disponibles

```
/dashboard              - Panel principal
/usuarios             - Gestión de usuarios
/departamentos        - Gestión de departamentos
/login                - Página de login
/registro             - Página de registro
/gestor               - Módulo gestor (con guard)
/admin-area           - Área de administración (con guard)
/funcionario          - Módulo funcionario (con guard)
```

## Servicios

### UserService
Comunicación con el backend para usuarios

```typescript
getUsers(): Observable<User[]>
getUserById(id: number): Observable<User>
createUser(user: User): Observable<User>
updateUser(id: number, user: User): Observable<User>
deleteUser(id: number): Observable<void>
```

### DepartmentService
Comunicación con el backend para departamentos

```typescript
getDepartments(): Observable<Department[]>
getDepartmentById(id: number): Observable<Department>
createDepartment(dept: Department): Observable<Department>
updateDepartment(id: number, dept: Department): Observable<Department>
deleteDepartment(id: number): Observable<void>
```

## Instalación y Ejecución

### Requisitos
- Node.js 18+
- npm 9+
- Angular CLI 18+

### Instalación
```bash
cd fp_frontend
npm install
```

### Desarrollo
```bash
npm start
# o
ng serve
```
La aplicación estará disponible en `http://localhost:4200`

### Build de Producción
```bash
npm run build
# o
ng build --configuration production
```

## Configuración del Backend

Actualiza las URLs del API en los servicios:

**src/app/core/services/user.service.ts**
```typescript
private apiUrl = 'http://tu-backend-url/api/users';
```

**src/app/core/services/department.service.ts**
```typescript
private apiUrl = 'http://tu-backend-url/api/departments';
```

## Características Responsivas

- **Desktop** (1200px+): Vista completa con sidebar visible
- **Tablet** (768px - 1199px): Sidebar ajustado, grid 2 columnas
- **Móvil** (< 768px): Sidebar oculto, stack vertical, interfaz optimizada

## Estado de Desarrollo

✅ Componentes completados:
- Layout principal (Sidebar + Header)
- Dashboard con cards interactivas
- Gestión de Usuarios con tabla y filtros
- Gestión de Departamentos con tabla y filtros
- Servicios para comunicación con backend
- Estilos globales y responsivos

📋 Próximas mejoras:
- Integración completa con backend
- Formularios de creación/edición
- Validaciones avanzadas
- Exportación de datos (CSV, PDF)
- Notificaciones en tiempo real
- Modo oscuro/claro (agregar más opciones)

## Dependencias Principales

- `@angular/core`: ^18.0.0
- `@angular/common`: ^18.0.0
- `@angular/forms`: ^18.0.0
- `@angular/router`: ^18.0.0
- `@angular/common/http`: ^18.0.0

## Licencia

Propietario - FlowPolicy 2026

## Contacto y Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.
