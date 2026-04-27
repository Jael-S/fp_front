import { Component } from '@angular/core';
import { MonitoreoComponent as GestorMonitoreoComponent } from '../../gestor/monitoreo/monitoreo.component';

@Component({
  selector: 'app-admin-monitoreo',
  standalone: true,
  imports: [GestorMonitoreoComponent],
  templateUrl: './monitoreo.component.html',
  styleUrl: './monitoreo.component.scss'
})
export class MonitoreoComponent {}
