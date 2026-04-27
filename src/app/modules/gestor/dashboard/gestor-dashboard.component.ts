import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { PoliticaService } from '../../../core/services/politica.service';
import { TramiteService } from '../../../core/services/tramite.service';
import { UsuarioService } from '../../../core/services/usuario.service';

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
  private readonly usuarioService = inject(UsuarioService);
  private readonly departamentoService = inject(DepartamentoService);
  private readonly politicaService = inject(PoliticaService);
  @ViewChild('tramitesChart') chartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  readonly totalTramites = signal(0);
  readonly totalUsuarios = signal(0);
  readonly totalDepartamentos = signal(0);
  readonly totalPoliticas = signal(0);
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
    forkJoin({
      tramites: this.tramiteService.list(0, 200),
      usuarios: this.usuarioService.list(0, 1),
      departamentos: this.departamentoService.list(0, 1),
      politicas: this.politicaService.list(0, 1),
    }).subscribe(({ tramites, usuarios, departamentos, politicas }) => {
      this.totalTramites.set(tramites.totalItems);
      this.totalUsuarios.set(usuarios.totalItems);
      this.totalDepartamentos.set(departamentos.totalItems);
      this.totalPoliticas.set(politicas.totalItems);
      this.pendientes.set(tramites.items.filter((x) => x.estado === 'PENDIENTE').length);
      this.completados.set(tramites.items.filter((x) => x.estado === 'COMPLETADO').length);
      this.enProceso.set(tramites.items.filter((x) => x.estado === 'EN_PROCESO').length);
      this.recientes.set(tramites.items.slice(0, 5).map((x) => `${x.id.slice(0, 8)} · ${x.estado}`));
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
