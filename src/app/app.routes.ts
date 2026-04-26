import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login/login.component';
import { RegisterComponent } from './modules/auth/register/register.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { UsersComponent } from './modules/users/users.component';
import { DepartmentsComponent } from './modules/departments/departments.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'usuarios', component: UsersComponent },
  { path: 'departamentos', component: DepartmentsComponent },
  {
    path: 'gestor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['GESTOR_SISTEMA'] },
    loadChildren: () => import('./modules/gestor/gestor.routes').then((m) => m.GESTOR_ROUTES),
  },
  {
    path: 'admin-area',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR_AREA'] },
    loadChildren: () => import('./modules/admin-area/admin-area.routes').then((m) => m.ADMIN_AREA_ROUTES),
  },
  {
    path: 'funcionario',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['FUNCIONARIO', 'OPERADOR'] },
    loadChildren: () => import('./modules/operador/operador.routes').then((m) => m.OPERADOR_ROUTES),
  },
  { path: 'operador', redirectTo: '/funcionario', pathMatch: 'full' },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];
