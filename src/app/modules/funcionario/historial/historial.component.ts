import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { EjecucionService } from '../../../core/services/ejecucion.service';
import { Ejecucion } from '../../../core/models/ejecucion.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss',
})
export class HistorialComponent {
  private readonly ejecucionService = inject(EjecucionService);
  readonly rows = signal<Ejecucion[]>([]);

  constructor() {
    this.ejecucionService.historial().subscribe({
      next: (data) => this.rows.set(data),
      error: () => this.rows.set([]),
    });
  }

  duracionTexto(ms: number | null | undefined): string {
    if (!ms) return '—';
    const min = Math.floor(ms / 60000);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}
