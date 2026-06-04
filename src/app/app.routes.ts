import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login/login.component';
import { RegistroComponent } from './modules/auth/registro/registro.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  {
    path: 'gestor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['GESTOR_SISTEMA'] },
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/gestor/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./modules/gestor/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'departamentos',
        loadComponent: () =>
          import('./modules/gestor/departamentos/departamentos.component').then((m) => m.DepartamentosComponent),
      },
      {
        path: 'politicas',
        loadComponent: () =>
          import('./modules/gestor/politicas/politicas.component').then((m) => m.PoliticasComponent),
      },
      {
        path: 'tramites',
        loadComponent: () =>
          import('./modules/gestor/tramites/tramites.component').then((m) => m.TramitesComponent),
      },
      {
        path: 'formularios',
        loadComponent: () =>
          import('./modules/gestor/formularios/formularios.component').then((m) => m.FormulariosComponent),
      },
      {
        path: 'monitoreo',
        loadComponent: () =>
          import('./modules/gestor/monitoreo/monitoreo.component').then((m) => m.MonitoreoComponent),
      },
      {
        path: 'diagrama/:politicaId',
        loadComponent: () =>
          import('./modules/gestor/diagrama/diagrama-editor.component').then((m) => m.DiagramaEditorComponent),
      },
      {
        path: 'asistente-ia',
        loadComponent: () =>
          import('./modules/gestor/asistente-ia/asistente-ia.component').then((m) => m.AsistenteIaComponent),
      },
      {
        path: 'analisis-ia',
        loadComponent: () =>
          import('./modules/gestor/analisis-ia/analisis-ia.component').then((m) => m.AnalisisIaComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin-area',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR_AREA'] },
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/admin-area/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'formularios',
        loadComponent: () =>
          import('./modules/admin-area/formularios/formularios.component').then((m) => m.FormulariosComponent),
      },
      {
        path: 'tramites',
        loadComponent: () =>
          import('./modules/admin-area/tramites/tramites.component').then((m) => m.TramitesComponent),
      },
      {
        path: 'monitoreo',
        loadComponent: () =>
          import('./modules/admin-area/monitoreo/monitoreo.component').then((m) => m.MonitoreoComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'funcionario',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['FUNCIONARIO'] },
    component: MainLayoutComponent,
    children: [
      {
        path: 'mis-tareas',
        loadComponent: () =>
          import('./modules/funcionario/mis-tareas/mis-tareas.component').then((m) => m.MisTareasComponent),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./modules/funcionario/historial/historial.component').then((m) => m.HistorialComponent),
      },
      {
        path: 'ejecutar-tarea/:id',
        loadComponent: () =>
          import('./modules/funcionario/ejecutar-tarea/ejecutar-tarea.component').then((m) => m.EjecutarTareaComponent),
      },
      { path: '', redirectTo: 'mis-tareas', pathMatch: 'full' },
    ],
  },
  {
    path: 'seguimiento',
    loadComponent: () =>
      import('./modules/public/seguimiento/seguimiento.component').then((m) => m.SeguimientoComponent),
  },
  { path: 'operador', redirectTo: '/funcionario/mis-tareas', pathMatch: 'full' },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
