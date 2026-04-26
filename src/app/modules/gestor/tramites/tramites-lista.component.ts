import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TramiteService } from '../../../core/services/tramite.service';
import { Tramite } from '../../../core/models/tramite.model';

@Component({
  selector: 'app-tramites-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Tramites</h2>
    <div class="filters">
      <select [(ngModel)]="estado" (change)="load()">
        <option value="">Todos</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="EN_PROCESO">En proceso</option>
        <option value="COMPLETADO">Completado</option>
        <option value="RECHAZADO">Rechazado</option>
      </select>
      <button (click)="load()">Refrescar</button>
    </div>
    <table *ngIf="rows().length">
      <thead><tr><th>ID</th><th>Politica</th><th>Estado</th><th>Departamento</th></tr></thead>
      <tbody>
        <tr *ngFor="let t of rows()">
          <td>{{ t.id }}</td>
          <td>{{ t.politicaId }}</td>
          <td>{{ t.estado }}</td>
          <td>{{ t.departamentoId || '-' }}</td>
        </tr>
      </tbody>
    </table>
  `,
})
export class TramitesListaComponent {
  private readonly tramiteService = inject(TramiteService);
  readonly rows = signal<Tramite[]>([]);
  estado = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.tramiteService.list(0, 50, { estado: this.estado }).subscribe((res) => this.rows.set(res.items));
  }
}
