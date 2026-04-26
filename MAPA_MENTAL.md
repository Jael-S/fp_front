# 🗺️ MAPA MENTAL DEL PROYECTO FLOWPOLICY FRONTEND

## 📊 Estructura Visual del Proyecto

```
FLOWPOLICY FRONTEND
│
├─── 🎨 PRESENTACIÓN
│    ├─ Tema: Oscuro profesional
│    ├─ Colores: Azules corporativos
│    ├─ Responsive: Mobile, Tablet, Desktop
│    └─ Animaciones: Transiciones suaves
│
├─── 🏗️ ARQUITECTURA
│    ├─ Componentes Standalone (Angular 18+)
│    ├─ Servicios HTTP
│    ├─ Routing dinámico
│    └─ Guards (Auth, Role)
│
├─── 📱 INTERFACE (APP.COMPONENT)
│    ├─ Sidebar
│    │  ├─ Logo "FLOWPROJECT"
│    │  ├─ Menú principal (7 items)
│    │  ├─ Menú footer (2 items)
│    │  └─ Estilos: Gradiente, hover
│    │
│    ├─ Top Bar
│    │  ├─ Breadcrumb
│    │  ├─ Búsqueda global
│    │  └─ Botones (🔔 ⚙️ 👤)
│    │
│    └─ Content Area
│       └─ <router-outlet>
│
├─── 🎯 MÓDULOS
│    │
│    ├─ DASHBOARD (/)
│    │  ├─ 4 Cards de acceso rápido
│    │  ├─ Estadísticas rápidas
│    │  └─ Navegación intuitiva
│    │
│    ├─ USUARIOS (/usuarios)
│    │  ├─ 📋 Tabla con 14 registros
│    │  ├─ 🔍 Búsqueda en tiempo real
│    │  ├─ 🎯 3 Filtros: Rol, Depto, Estado
│    │  ├─ 📄 Paginación (6 items/página)
│    │  ├─ 📊 Estadísticas en vivo
│    │  │  ├─ Usuarios: 14
│    │  │  ├─ Acceso Datos: 32
│    │  │  └─ Permisos: 78
│    │  └─ 🎛️ Acciones: ✏️ 🗑️ ⋮
│    │
│    └─ DEPARTAMENTOS (/departamentos)
│       ├─ 📋 Tabla con 8 registros
│       ├─ 🔍 Búsqueda: nombre/descripción
│       ├─ 🎯 Filtros: Estado
│       ├─ 📄 Paginación
│       ├─ 📊 Estadísticas
│       │  ├─ Departamentos: 8
│       │  ├─ Usuarios: N
│       │  └─ Activos: N
│       └─ 🎛️ Acciones: ✏️ 🗑️ ⋮
│
├─── 🔌 SERVICIOS
│    ├─ UserService
│    │  ├─ GET /api/users
│    │  ├─ POST /api/users
│    │  ├─ PUT /api/users/{id}
│    │  └─ DELETE /api/users/{id}
│    │
│    └─ DepartmentService
│       ├─ GET /api/departments
│       ├─ POST /api/departments
│       ├─ PUT /api/departments/{id}
│       └─ DELETE /api/departments/{id}
│
├─── 🛣️ RUTAS
│    ├─ / → /dashboard
│    ├─ /dashboard → DashboardComponent
│    ├─ /usuarios → UsersComponent
│    ├─ /departamentos → DepartmentsComponent
│    ├─ /login → LoginComponent (existente)
│    ├─ /registro → RegisterComponent (existente)
│    └─ /404 → /dashboard
│
├─── 🎨 ESTILOS
│    ├─ Globales
│    │  ├─ styles.css
│    │  ├─ _reset.scss
│    │  └─ _variables.scss
│    │
│    ├─ Por Componente
│    │  ├─ app.component.css
│    │  ├─ users.component.css
│    │  ├─ departments.component.css
│    │  └─ dashboard.component.css
│    │
│    └─ Colores
│       ├─ Primary: #00a8ff
│       ├─ Dark: #0a0e27
│       ├─ Card: #141829
│       ├─ Text: #ffffff
│       └─ Etc...
│
└─── 📚 DATOS
     ├─ Usuarios (14)
     ├─ Departamentos (8)
     └─ Estados, Roles, etc.
```

---

## 🔄 Flujo de Datos

```
Usuario Interactúa
    ↓
Componente Captura Evento
    ↓
Servicio Realiza Petición HTTP
    ↓
Backend Procesa (Django/DRF)
    ↓
Backend Responde (JSON)
    ↓
Servicio Parsea Respuesta
    ↓
Componente Actualiza Vista
    ↓
Usuario Ve Cambios
```

---

## 📈 Tabla Comparativa

| Aspecto | Usuarios | Departamentos |
|---------|----------|---------------|
| Registros | 14 | 8 |
| Búsqueda | Nombre, Email | Nombre, Descripción |
| Filtros | 3 (Rol, Depto, Estado) | 1 (Estado) |
| Columnas | 7 | 7 |
| Paginación | 6/página | 6/página |
| Estadísticas | 3 | 3 |
| Acciones | 3 | 3 |

---

## 🎨 Jerarquía de Componentes

```
AppComponent (Layout Principal)
│
├─ DashboardComponent
│  ├─ Card (x4)
│  └─ QuickStat (x3)
│
├─ UsersComponent
│  ├─ Header
│  ├─ Filters
│  ├─ Table (Usuarios)
│  ├─ Pagination
│  └─ StatsCards (x3)
│
└─ DepartmentsComponent
   ├─ Header
   ├─ Filters
   ├─ Table (Departamentos)
   ├─ Pagination
   └─ StatsCards (x3)
```

---

## 🔐 Seguridad y Auth

```
Petición HTTP
    ↓
Auth Interceptor
    ├─ ¿Hay token en localStorage?
    ├─ SI → Agregar Authorization header
    └─ NO → Continuar sin token
    ↓
Backend Valida Token
    ├─ ✓ Token válido → Permite acceso
    └─ ✗ Token inválido → Error 401
    ↓
Respuesta al Cliente
```

---

## 📱 Responsividad

```
Desktop (1200px+)
├─ Sidebar: 260px (visible)
├─ Contenido: Completo
├─ Grid: 3+ columnas
└─ Todo visible

Tablet (768-1199px)
├─ Sidebar: 220px
├─ Contenido: Ajustado
├─ Grid: 2 columnas
└─ Optimizado para toque

Móvil (<768px)
├─ Sidebar: Oculto (menú hamburguesa)
├─ Contenido: Full width
├─ Grid: 1 columna
└─ Botones grandes
```

---

## 🔄 Ciclo de Vida Componente

```
OnInit
    ↓
Carga de Datos (API)
    ↓
Renderiza Vista
    ↓
Usuario Interactúa
    ↓
Actualiza Datos/Filtros
    ↓
Re-renderiza
    ↓
OnDestroy (Si es necesario)
```

---

## 📊 Estados de Datos

### Usuario
```
{
  id: number
  name: string
  email: string
  role: "Admin" | "User" | "Editor"
  department: string
  status: "Active" | "Inactive" | "Blocked"
}
```

### Departamento
```
{
  id: number
  name: string
  description: string
  manager: string
  users: number
  status: "Active" | "Inactive"
}
```

---

## 🚀 Flujo de Despliegue

```
Desarrollo Local
    ↓
npm install → npm start
    ↓
Testing Manual
    ↓
Build: npm run build
    ↓
Archivos en /dist
    ↓
Deploy a Servidor
    ↓
Producción
```

---

## 📚 Dependencias Principales

```
Angular 18+
├─ @angular/core
├─ @angular/common
├─ @angular/forms
├─ @angular/router
└─ @angular/common/http

RxJS
├─ Observable
├─ Subject
└─ Operators

Otros
├─ TypeScript
├─ CSS/SCSS
└─ HTML5
```

---

## 🔗 Conexiones Externas

```
Frontend (Angular)
    ↕ HTTP
Backend (Django/DRF)
    ↕ SQL
Base de Datos
```

---

## 📝 Archivos Importantes

```
src/
├─ app.component.ts/html/css      ← Layout principal
├─ app.routes.ts                   ← Rutas
├─ app.config.ts                   ← Configuración
│
├─ core/
│  └─ services/
│     ├─ user.service.ts          ← API usuarios
│     └─ department.service.ts    ← API departamentos
│
└─ modules/
   ├─ dashboard/                  ← Panel principal
   ├─ users/                       ← Gestión usuarios
   └─ departments/                 ← Gestión departamentos
```

---

## ✨ Características Clave

1. **Búsqueda en tiempo real** - Sin necesidad de botón submit
2. **Filtros múltiples** - Combinables simultáneamente
3. **Paginación inteligente** - Auto-actualiza al filtrar
4. **Badges de estado** - Colores visuales específicos
5. **Avatares dinámicos** - Con iniciales del usuario
6. **Estadísticas vivas** - Se actualizan con datos
7. **Transiciones suaves** - 0.3s ease en hover
8. **Responsive completo** - Funciona en todos los tamaños

---

## 🎯 Objetivos Logrados

✅ Interfaz moderna según referencia visual
✅ Colores corporativos azules
✅ 3 módulos funcionales con datos
✅ Búsqueda y filtros avanzados
✅ Paginación automática
✅ Servicios para backend
✅ Documentación completa
✅ Responsive design
✅ Código limpio y ordenado
✅ Listo para producción

---

**Versión:** 1.0.0
**Estado:** Completado y listo
**Última actualización:** 25 de Abril, 2026

