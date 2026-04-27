import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Politica } from '../../../core/models/politica.model';
import { MonitoreoService } from '../../../core/services/monitoreo.service';
import { TramiteService } from '../../../core/services/tramite.service';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoreo.component.html',
  styleUrl: './monitoreo.component.scss',
})
export class MonitoreoComponent implements OnDestroy {
  private readonly tramiteService = inject(TramiteService);
  private readonly monitoreoService = inject(MonitoreoService);

  readonly politicas = signal<Politica[]>([]);
  readonly politicaId = signal('');
  readonly stats = signal<Record<string, unknown> | null>(null);
  readonly loading = signal(false);

  constructor() {
    this.tramiteService.listPoliticasActivas().subscribe({
      next: (rows) => {
        this.politicas.set(rows);
        if (rows.length > 0) {
          this.politicaId.set(rows[0].id);
          this.load();
        }
      },
      error: () => this.politicas.set([]),
    });
  }

  load(): void {
    if (!this.politicaId()) {
      this.stats.set(null);
      return;
    }
    this.loading.set(true);
    this.tramiteService.monitorPolitica(this.politicaId()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.stats.set(null);
        this.loading.set(false);
      },
    });
    this.monitoreoService.disconnect();
    this.monitoreoService.watchPolitica(this.politicaId(), (payload) => {
      this.stats.set(payload as Record<string, unknown>);
    });
  }

  ngOnDestroy(): void {
    this.monitoreoService.disconnect();
  }
}
