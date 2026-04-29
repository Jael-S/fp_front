import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TramiteService } from '../../../core/services/tramite.service';
import { Tramite } from '../../../core/models/tramite.model';

@Component({
  selector: 'app-tramites-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="tramites-card">
      <div class="top-bar">
        <h2>Trámites</h2>
        <div class="filters">
          <select [(ngModel)]="estado" (change)="load()">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
          <button class="btn-refresh" (click)="load()">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      @if (rows().length === 0) {
        <p class="empty">No hay trámites registrados.</p>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Creado por</th>
                <th>Fecha creación</th>
              </tr>
            </thead>
            <tbody>
              @for (t of rows(); track t.id) {
                <tr>
                  <td class="cod">{{ t.codigoSeguimiento || t.id.slice(0,8) + '…' }}</td>
                  <td class="titulo">{{ t.titulo }}</td>
                  <td>
                    <span class="prio" [class.alta]="t.prioridad === 'ALTA'"
                                       [class.media]="t.prioridad === 'MEDIA'"
                                       [class.baja]="t.prioridad === 'BAJA'">
                      {{ t.prioridad }}
                    </span>
                  </td>
                  <td>
                    <span class="badge"
                          [class.pend]="t.estado === 'PENDIENTE'"
                          [class.proc]="t.estado === 'EN_PROCESO'"
                          [class.comp]="t.estado === 'COMPLETADO'"
                          [class.rech]="t.estado === 'RECHAZADO' || t.estado === 'CANCELADO'">
                      {{ t.estado }}
                    </span>
                  </td>
                  <td>{{ t.creadoPorNombre || '—' }}</td>
                  <td>{{ t.creadoEn | date:'dd/MM/yy HH:mm' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .tramites-card { background: white; border-radius: 16px; border: 1px solid var(--border-soft); padding: 1rem; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; h2 { margin: 0; } }
    .filters { display: flex; gap: 0.5rem; align-items: center; }
    select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.35rem 0.65rem; font-size: 0.85rem; }
    .btn-refresh { border: none; background: #f1f5f9; border-radius: 8px; padding: 0.35rem 0.65rem; cursor: pointer; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
    th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; color: #64748b; font-weight: 600; white-space: nowrap; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .cod { font-family: monospace; font-size: 0.78rem; color: #94a3b8; }
    .titulo { font-weight: 600; max-width: 260px; }
    .prio { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .prio.alta  { background: #fee2e2; color: #991b1b; }
    .prio.media { background: #fef3c7; color: #92400e; }
    .prio.baja  { background: #d1fae5; color: #065f46; }
    .badge { font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 20px; }
    .badge.pend { background: #fef3c7; color: #92400e; }
    .badge.proc { background: #dbeafe; color: #1e40af; }
    .badge.comp { background: #d1fae5; color: #065f46; }
    .badge.rech { background: #fee2e2; color: #991b1b; }
    .empty { color: #94a3b8; text-align: center; padding: 2rem 0; }
  `],
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
