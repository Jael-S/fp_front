# fp_frontend

> Sistema de Gestión y Automatización de Trámites basado en Políticas de Negocio — Frontend Web

Panel de administración web del sistema **FlowPolicy**, construido con Angular 21. Permite diseñar políticas de negocio mediante diagramas de actividades, gestionar trámites en tiempo real, monitorear el estado de cada proceso y visualizar el mapa de cobertura del servicio.

---

## Stack

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular CLI | 21.2.7 | Framework principal |
| TypeScript | 5.x | Lenguaje principal |
| Angular Material | 17.x | Componentes UI |
| SCSS | — | Estilos con variables |
| @stomp/stompjs | 7.x | WebSockets (STOMP sobre SockJS) |
| sockjs-client | 1.x | Fallback para WebSockets |
| jwt-decode | 4.x | Decodificación de JWT en cliente |
| Leaflet.js | 1.9.x | Mapa de cobertura interactivo |
| html2canvas | 1.x | Exportar diagrama como imagen |
| jsPDF | 2.x | Exportar diagrama como PDF |
| RxJS | 7.x | Programación reactiva |
| Node.js | 22.19.0 | Entorno de ejecución |
| npm | 11.6.0 | Gestor de paquetes |

---

## Requisitos previos

```bash
node --version     # Node.js 22.19.0+
npm --version      # npm 11.6.0+
ng version         # Angular CLI 21.2.7+
git --version      # Git (cualquier versión reciente)
```

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/fp_frontend.git
cd fp_frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar entorno local

Verifica que `src/environments/environment.ts` apunte al backend local:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  wsUrl: 'http://localhost:8080/ws'
};
```

### 4. Ejecutar en modo desarrollo

```bash
ng serve
# La aplicación inicia en: http://localhost:4200
```

> El backend (`fp_backend`) debe estar corriendo en `http://localhost:8080` para que el frontend funcione.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/                              ← Servicios y lógica global
│   │   ├── auth/
│   │   │   ├── auth.guard.ts              ← Protección de rutas
│   │   │   ├── auth.interceptor.ts        ← Agrega JWT a cada request
│   │   │   └── role.guard.ts              ← Protección por rol
│   │   ├── models/                        ← Interfaces TypeScript globales
│   │   │   ├── api-response.model.ts
│   │   │   └── user.model.ts
│   │   └── services/
│   │       ├── auth.service.ts            ← Login, logout, JWT storage
│   │       ├── websocket.service.ts       ← Conexión WebSocket global
│   │       └── notification.service.ts
│   │
│   ├── shared/                            ← Componentes reutilizables
│   │   ├── components/
│   │   │   ├── navbar/
│   │   │   ├── sidebar/
│   │   │   ├── loader/
│   │   │   └── confirm-dialog/
│   │   └── pipes/
│   │
│   ├── modules/                           ← Módulos por rol
│   │   ├── gestor/                        ← GESTOR_SISTEMA
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── usuarios/              ← CU2: Gestionar Usuarios y Roles
│   │   │   │   ├── departamentos/         ← CU3: Gestionar Departamentos
│   │   │   │   ├── politicas/             ← CU4: Gestionar Políticas de Negocio
│   │   │   │   │   ├── lista/
│   │   │   │   │   ├── editor-diagrama/   ← CU6: Canvas drag & drop + IA
│   │   │   │   │   └── monitor/           ← CU9: Verde/amarillo/rojo
│   │   │   │   ├── tramites/              ← CU7: Gestionar Trámites
│   │   │   │   ├── analisis-ia/           ← CU11: Análisis con IA
│   │   │   │   └── mapa/                  ← CU12: Mapa de Cobertura
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── gestor.routes.ts
│   │   │
│   │   ├── admin-area/                    ← ADMINISTRADOR_AREA
│   │   │   ├── pages/
│   │   │   │   ├── formularios/           ← CU5: Gestionar Formularios del Área
│   │   │   │   ├── tramites/              ← CU7: Ver trámites del área
│   │   │   │   ├── monitor/               ← CU9: Monitor de su departamento
│   │   │   │   └── mapa/                  ← CU12: Ver mapa de cobertura
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── admin-area.routes.ts
│   │   │
│   │   └── operador/                      ← OPERADOR
│   │       ├── pages/
│   │       │   ├── actividades/           ← CU8: Lista de actividades pendientes
│   │       │   └── ejecutar-actividad/    ← CU8: Rellenar formulario del nodo
│   │       ├── models/
│   │       ├── services/
│   │       └── operador.routes.ts
│   │
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
│
├── environments/
│   ├── environment.ts          ← URLs locales
│   └── environment.prod.ts     ← URLs de Azure
│
└── styles/
    ├── _variables.scss         ← Paleta de colores y variables
    └── _reset.scss             ← Reset CSS global
```

---

## Paleta de colores

El sistema usa un tema celeste pastel suave, pensado para entornos de gestión formal y lectura prolongada:

| Variable CSS | Color | Uso |
|-------------|-------|-----|
| `--primary-100` | `#D6EFFA` | Fondos suaves, hover de tarjetas |
| `--primary-200` | `#A8D8F0` | Bordes activos, separadores |
| `--primary-300` | `#72BFE6` | Iconos, texto secundario |
| `--primary-400` | `#3DA4D8` | Botones secundarios, links |
| `--primary-500` | `#1A87C0` | Botones primarios, elementos de acción |
| `--bg-dark` | `#0D2233` | Fondo principal de la app |
| `--bg-panel` | `#132D42` | Fondo del sidebar y panels |
| `--bg-card` | `#1A3A52` | Fondo de cards y modales |
| `--text-primary` | `#EAF6FC` | Texto principal |
| `--text-muted` | `#90C4DC` | Texto secundario, placeholders |
| `--success` | `#4DD9AC` | Estado completado — nodo verde monitor |
| `--danger` | `#F26B6B` | Estado rechazado — nodo rojo monitor |
| `--warning` | `#F5C842` | Estado en proceso — nodo amarillo monitor |
| `--info` | `#5BB8E8` | Notificaciones, estado informativo |

---

## Módulos y acceso por rol

| Módulo | Rol requerido | Acceso |
|--------|---------------|--------|
| `/gestor` | `GESTOR_SISTEMA` | Dashboard, usuarios, departamentos, políticas, editor diagrama, monitor, IA, mapa |
| `/admin-area` | `ADMINISTRADOR_AREA` | Formularios de su área, trámites, monitor de su departamento, mapa |
| `/operador` | `OPERADOR` | Lista de actividades pendientes, ejecutar actividad |

---

## Variables de entorno

| Archivo | Uso |
|---------|-----|
| `environment.ts` | Desarrollo local (`ng serve`) |
| `environment.prod.ts` | Producción Azure (`ng build --configuration production`) |

---

## Despliegue en Azure

```bash
# Build de producción
ng build --configuration production

# Deploy en Azure Static Web Apps (con Azure CLI)
az staticwebapp deploy \
  --name fp-frontend \
  --resource-group rg-flowpolicy \
  --source ./dist/fp-frontend
```

---

## Convención de commits

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(gestor): agregar página de gestión de departamentos
fix(auth): corregir redirección post-login según rol
feat(diagrama): implementar editor drag & drop con generación por IA
feat(mapa): integrar Leaflet para mapa de cobertura del servicio
style(sidebar): ajustar responsividad en pantallas medianas
refactor(politicas): separar lógica del editor en servicio
chore(deps): actualizar @angular/material
```

---

## Licencia

Proyecto académico — Universidad Autónoma Gabriel René Moreno
Materia: Ingeniería de Software I — Ing. Martínez Canedo