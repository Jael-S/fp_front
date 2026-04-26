import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TramiteService } from '../../../core/services/tramite.service';

Chart.register(...registerables);

@Component({
  selector: 'app-gestor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestor-dashboard.component.html',
  styleUrl: './gestor-dashboard.component.scss',
})
export class GestorDashboardComponent implements AfterViewInit, OnDestroy {
  private readonly tramiteService = inject(TramiteService);
  @ViewChild('tramitesChart') chartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  readonly total = signal(0);
  readonly pendientes = signal(0);
  readonly completados = signal(0);
  readonly enProceso = signal(0);
  readonly recientes = signal<string[]>([]);

  constructor() {
    this.load();
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private load(): void {
    this.tramiteService.list(0, 200).subscribe((res) => {
      this.total.set(res.totalItems);
      this.pendientes.set(res.items.filter((x) => x.estado === 'PENDIENTE').length);
      this.completados.set(res.items.filter((x) => x.estado === 'COMPLETADO').length);
      this.enProceso.set(res.items.filter((x) => x.estado === 'EN_PROCESO').length);
      this.recientes.set(res.items.slice(0, 5).map((x) => `${x.id.slice(0, 8)} · ${x.estado}`));
      this.renderChart();
    });
  }

  private renderChart(): void {
    if (!this.chartRef) return;
    this.chart?.destroy();
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pendiente', 'En proceso', 'Completado'],
        datasets: [
          {
            data: [this.pendientes(), this.enProceso(), this.completados()],
            backgroundColor: ['#f59e0b', '#4f46e5', '#10b981'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        maintainAspectRatio: false,
      },
    });
  }
}
