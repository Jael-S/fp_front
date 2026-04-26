import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login/login.component';
import { RegistroComponent } from './modules/auth/registro/registro.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { DashboardComponent as GestorDashboardComponent } from './modules/gestor/dashboard/dashboard.component';
import { UsuariosComponent } from './modules/gestor/usuarios/usuarios.component';
import { DepartamentosComponent } from './modules/gestor/departamentos/departamentos.component';
import { PoliticasComponent } from './modules/gestor/politicas/politicas.component';
import { FormulariosComponent as GestorFormulariosComponent } from './modules/gestor/formularios/formularios.component';
import { TramitesComponent as GestorTramitesComponent } from './modules/gestor/tramites/tramites.component';
import { DiagramaEditorComponent } from './modules/gestor/diagrama/diagrama-editor.component';
import { MonitoreoComponent as GestorMonitoreoComponent } from './modules/gestor/monitoreo/monitoreo.component';
import { AsistenteIaComponent } from './modules/gestor/asistente-ia/asistente-ia.component';
import { MapaCoberturaComponent as GestorMapaComponent } from './modules/gestor/mapa-cobertura/mapa-cobertura.component';
import { DashboardComponent as AdminDashboardComponent } from './modules/admin-area/dashboard/dashboard.component';
import { FormulariosComponent as AdminFormulariosComponent } from './modules/admin-area/formularios/formularios.component';
import { TramitesComponent as AdminTramitesComponent } from './modules/admin-area/tramites/tramites.component';
import { MonitoreoComponent as AdminMonitoreoComponent } from './modules/admin-area/monitoreo/monitoreo.component';
import { MapaCoberturaComponent as AdminMapaComponent } from './modules/admin-area/mapa-cobertura/mapa-cobertura.component';
import { MisTareasComponent as FuncionarioMisTareasComponent } from './modules/funcionario/mis-tareas/mis-tareas.component';
import { EjecutarTareaComponent } from './modules/funcionario/ejecutar-tarea/ejecutar-tarea.component';
import { HistorialComponent } from './modules/funcionario/historial/historial.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  {
    path: 'gestor',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['GESTOR_SISTEMA'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: GestorDashboardComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'departamentos', component: DepartamentosComponent },
      { path: 'politicas', component: PoliticasComponent },
      { path: 'formularios', component: GestorFormulariosComponent },
      { path: 'tramites', component: GestorTramitesComponent },
      { path: 'diagrama/:politicaId', component: DiagramaEditorComponent },
      { path: 'monitoreo', component: GestorMonitoreoComponent },
      { path: 'asistente-ia', component: AsistenteIaComponent },
      { path: 'mapa-cobertura', component: GestorMapaComponent },
    ],
  },
  {
    path: 'admin-area',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR_AREA'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'formularios', component: AdminFormulariosComponent },
      { path: 'tramites', component: AdminTramitesComponent },
      { path: 'monitoreo', component: AdminMonitoreoComponent },
      { path: 'mapa-cobertura', component: AdminMapaComponent },
    ],
  },
  {
    path: 'funcionario',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['FUNCIONARIO', 'OPERADOR'] },
    children: [
      { path: '', redirectTo: 'mis-tareas', pathMatch: 'full' },
      { path: 'mis-tareas', component: FuncionarioMisTareasComponent },
      { path: 'ejecutar-tarea/:id', component: EjecutarTareaComponent },
      { path: 'historial', component: HistorialComponent },
    ],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
