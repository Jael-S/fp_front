import { Component } from '@angular/core';
import { GestorDashboardComponent } from './gestor-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GestorDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
