import { Component } from '@angular/core';
import { GestorDashboardComponent } from '../../gestor/dashboard/gestor-dashboard.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [GestorDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
