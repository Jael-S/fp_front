# FlowPolicy Frontend

> Sistema de Gestión y Automatización de Trámites basado en Políticas de Negocio — Frontend Web

Aplicación Angular 21 para el sistema **FlowPolicy**. Incluye diagramador BPMN con swimlanes, constructor de formularios dinámicos, monitoreo en tiempo real por WebSocket, análisis de cuellos de botella y un asistente virtual integrado.

---

## Stack

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular CLI | 21.2.7 | Framework principal |
| TypeScript | 5.9 | Lenguaje principal |
| Angular Material | 21.x | Componentes UI |
| bpmn-js | 18.15.0 | Diagramador BPMN (canvas drag & drop) |
| @stomp/stompjs | 7.x | WebSocket STOMP |
| sockjs-client | 1.6.x | Fallback WebSocket |
| FontAwesome | 7.x | Iconografía |
| Chart.js | 4.x | Gráficos en dashboard |
| Leaflet.js | 1.9.x | Mapa de cobertura |
| jsPDF + html2canvas | — | Exportar diagrama a PDF/imagen |
| jwt-decode | 4.x | Decodificación de JWT en cliente |
| Node.js | 22+ | Entorno de ejecución |
| npm | 11.6.0 | Gestor de paquetes |

---

## Instalación y ejecución

```bash
cd fp_frontend
npm install
ng serve
# Aplicación en http://localhost:4200
```

El backend debe estar corriendo en `http://localhost:8080` y el microservicio IA en `http://localhost:5000`.

### Entorno (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl:  'http://localhost:8080/ws-monitor'
};
```

---

## Módulos por rol

### GESTOR_SISTEMA — `/gestor/*`

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Métricas del sistema |
| Usuarios | CRUD de usuarios con paginación y filtros |
| Departamentos | CRUD de departamentos |
| Políticas | Lista, crear, activar/desactivar |
| Diagramador BPMN | Canvas bpmn-js con swimlanes, paleta de herramientas, propiedades de nodo, generación con IA (voz o texto) |
| Formularios | Constructor drag & drop con 7 tipos de campo, generación de campos con IA |
| Trámites | CRUD de trámites, selección de política activa |
| Monitoreo | Diagrama con estados en tiempo real (🟢 completado / 🟡 en proceso / 🔴 pendiente) vía WebSocket |
| Análisis IA | Detección de cuellos de botella por política con nivel de riesgo y sugerencias |
| Asistente virtual | Chatbot flotante con respuestas sobre cómo usar el sistema |

### ADMINISTRADOR_AREA — `/admin-area/*`

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Métricas del área |
| Formularios | Gestión de formularios del departamento |
| Trámites | Vista de trámites activos del área |
| Monitoreo | Estado de procesos del departamento |
| Mapa de cobertura | Mapa Leaflet del área de servicio |

### FUNCIONARIO — `/funcionario/*`

| Módulo | Descripción |
|--------|-------------|
| Mis Tareas | Bandeja de tareas pendientes y en proceso |
| Ejecutar Tarea | Formulario dinámico con todos los tipos de campo; completar o rechazar |
| Historial | Tareas completadas/rechazadas |

---

## Tipos de campo en formularios

| Tipo | Componente renderizado |
|------|----------------------|
| `TEXTO` | Input text |
| `NUMERO` | Input number |
| `FECHA` | Date picker |
| `SELECCION` | Select / dropdown |
| `ARCHIVO` | File upload |
| `IMAGEN` | Image upload con preview |
| `BOOLEANO` | Checkbox |

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/            ← AuthGuard, RoleGuard
│   ├── interceptors/      ← JWT interceptor
│   ├── models/            ← Interfaces TypeScript (politica, usuario, formulario, ia…)
│   └── services/          ← auth, usuario, departamento, politica, formulario,
│                             tramite, ejecucion, tarea, monitoreo, ia, websocket
│
├── layouts/
│   ├── main-layout/       ← Shell con sidebar + header (incluye asistente virtual)
│   ├── sidebar/
│   └── header/
│
├── modules/
│   ├── auth/              ← Login, Registro
│   ├── gestor/            ← Dashboard, Usuarios, Departamentos, Políticas,
│   │                         Diagrama, Formularios, Trámites, Monitoreo,
│   │                         Análisis IA, Asistente IA
│   ├── admin-area/        ← Dashboard, Formularios, Trámites, Monitoreo, Mapa
│   └── funcionario/       ← Mis Tareas, Ejecutar Tarea, Historial
│
└── shared/
    └── components/
        └── asistente-virtual/   ← Chatbot flotante (respuestas predefinidas, sin IA)
```

---

## Funcionalidades IA (requieren microservicio Python en puerto 5000)

| Función | Descripción |
|---------|-------------|
| Generar diagrama | Describe el proceso en texto o por voz; la IA genera nodos, carriles y XML BPMN |
| Generar formulario | Describe la tarea; la IA propone campos con tipos y validaciones |
| Analizar cuellos | El backend Java analiza tiempos reales de ejecución; la UI muestra riesgo ALTO/MEDIO |

---

## Licencia

Proyecto académico — Ingeniería de Software I
