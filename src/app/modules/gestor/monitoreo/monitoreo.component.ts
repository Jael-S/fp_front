import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as joint from '@joint/core';

import { TramiteService } from '../../../core/services/tramite.service';
import { PoliticaService } from '../../../core/services/politica.service';
import { MonitorService, type MonitorData, type NodoMonitorInfo, type TramiteMonitorData } from '../../../core/services/monitor.service';
import type { Politica } from '../../../core/models/politica.model';
import type { Tramite } from '../../../core/models/tramite.model';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoreo.component.html',
  styleUrl: './monitoreo.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MonitoreoComponent implements AfterViewInit, OnDestroy {
  private readonly tramiteService  = inject(TramiteService);
  private readonly politicaService = inject(PoliticaService);
  private readonly monitorService  = inject(MonitorService);
  private readonly ngZone          = inject(NgZone);
  private readonly cdr             = inject(ChangeDetectorRef);

  // ── Política ────────────────────────────────────────────────────────────────
  readonly politicas             = signal<Politica[]>([]);
  readonly politicaSeleccionada  = signal('');
  readonly stats                 = signal<MonitorData | null>(null);

  // ── Trámite ─────────────────────────────────────────────────────────────────
  readonly tramites              = signal<Tramite[]>([]);
  readonly tramiteSeleccionado   = signal('');
  readonly tramiteStats          = signal<TramiteMonitorData | null>(null);

  readonly loading               = signal(false);

  private graph: joint.dia.Graph | null = null;
  private paper: joint.dia.Paper | null = null;
  private diagramaJsonActual: string | null = null;

  // ── Ciclo de vida ────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    this.initViewer();
    this.tramiteService.listPoliticasActivas().subscribe({
      next: (rows) => {
        this.politicas.set(rows);
        if (rows.length > 0) {
          this.politicaSeleccionada.set(rows[0].id);
          this.cargar();
        }
      },
      error: () => this.politicas.set([]),
    });
  }

  ngOnDestroy(): void {
    this.monitorService.disconnect();
    this.paper = null;
    this.graph = null;
  }

  // ── Cambio de política ───────────────────────────────────────────────────────

  onPoliticaChange(id: string): void {
    this.politicaSeleccionada.set(id);
    this.tramiteSeleccionado.set('');
    this.tramites.set([]);
    this.tramiteStats.set(null);
    this.stats.set(null);
    this.monitorService.disconnect();
    if (id) this.cargar();
  }

  // ── Cambio de trámite ────────────────────────────────────────────────────────

  onTramiteChange(id: string): void {
    this.tramiteSeleccionado.set(id);
    this.tramiteStats.set(null);
    if (!id) {
      this.aplicarColoresGenerales(this.stats());
      return;
    }
    this.cargarTramite(id);
  }

  // ── Carga principal (política) ───────────────────────────────────────────────

  cargar(): void {
    const politicaId = this.politicaSeleccionada();
    if (!politicaId) return;
    this.loading.set(true);

    forkJoin({
      politica: this.politicaService.getById(politicaId),
      monitor:  this.monitorService.getEstado(politicaId),
      tramites: this.tramiteService.list(0, 100, { politicaId }),
    }).subscribe({
      next: ({ politica, monitor, tramites }) => {
        this.stats.set(monitor);
        this.tramites.set(tramites.items ?? []);
        this.diagramaJsonActual = politica.diagramaJson ?? null;
        this.loading.set(false);
        this.renderizarDiagrama(this.diagramaJsonActual);
        this.aplicarColoresGenerales(monitor);
        this.cdr.detectChanges();
        this.monitorService.watch(politicaId, () =>
          this.ngZone.run(() => this.refrescarPolitica())
        );
      },
      error: () => { this.loading.set(false); this.stats.set(null); },
    });
  }

  // ── Carga de trámite específico ──────────────────────────────────────────────

  private cargarTramite(tramiteId: string): void {
    this.monitorService.getEstadoTramite(tramiteId).subscribe({
      next: (data) => {
        this.tramiteStats.set(data);
        this.limpiarColores();
        this.aplicarColoresTramite(data);
        this.cdr.detectChanges();
      },
      error: () => this.tramiteStats.set(null),
    });
  }

  // ── Refresco por WebSocket ───────────────────────────────────────────────────

  private refrescarPolitica(): void {
    const politicaId = this.politicaSeleccionada();
    if (!politicaId) return;
    this.monitorService.getEstado(politicaId).subscribe({
      next: (monitor) => {
        this.stats.set(monitor);
        if (this.tramiteSeleccionado()) {
          this.cargarTramite(this.tramiteSeleccionado());
        } else {
          this.limpiarColores();
          this.aplicarColoresGenerales(monitor);
        }
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // ── Visor JointJS (lectura) ──────────────────────────────────────────────────

  private initViewer(): void {
    const container = document.getElementById('bpmn-monitor');
    if (!container) return;
    this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
    this.paper = new joint.dia.Paper({
      el: container,
      model: this.graph,
      width: container.offsetWidth || 900,
      height: 480,
      cellViewNamespace: joint.shapes,
      interactive: false,
      background: { color: '#f9fafb' },
      gridSize: 1,
    });
  }

  private renderizarDiagrama(json: string | null): void {
    if (!this.graph || !json?.trim()) return;
    try {
      const data = JSON.parse(json);
      this.graph.fromJSON(data);
    } catch { /* JSON inválido o vacío */ }
  }

  // ── Coloreo ──────────────────────────────────────────────────────────────────

  private aplicarColoresGenerales(monitor: MonitorData | null): void {
    if (!monitor) return;
    for (const info of Object.values(monitor.nodos ?? {})) {
      this.colorearCelda(info.elementId, this.colorGeneral(info.estado));
    }
  }

  private aplicarColoresTramite(data: TramiteMonitorData): void {
    for (const [elementId, estado] of Object.entries(data.estadoNodos ?? {})) {
      this.colorearCelda(elementId, this.colorTramite(estado));
    }
  }

  private limpiarColores(): void {
    // Volver a renderizar desde JSON restaura los colores originales
    this.renderizarDiagrama(this.diagramaJsonActual);
  }

  private colorearCelda(elementId: string, { fill, stroke }: { fill: string; stroke: string }): void {
    if (!this.graph) return;
    const cell = this.graph.getCells().find(
      c => c.prop('tempId') === elementId || c.id === elementId
    );
    if (!cell || !(cell instanceof joint.dia.Element)) return;
    (cell as joint.dia.Element).attr('body/fill', fill);
    (cell as joint.dia.Element).attr('body/stroke', stroke);
    (cell as joint.dia.Element).attr('body/strokeWidth', 2.5);
  }

  private colorGeneral(estado: string): { fill: string; stroke: string } {
    switch (estado) {
      case 'EN_PROCESO': return { fill: '#fef3c7', stroke: '#f59e0b' };
      case 'PENDIENTE':  return { fill: '#fee2e2', stroke: '#ef4444' };
      default:           return { fill: '#f9fafb', stroke: '#d1d5db' };
    }
  }

  private colorTramite(estado: string): { fill: string; stroke: string } {
    switch (estado) {
      case 'COMPLETADO':      return { fill: '#d1fae5', stroke: '#10b981' };
      case 'EN_PROCESO':      return { fill: '#fef3c7', stroke: '#f59e0b' };
      case 'PENDIENTE':       return { fill: '#dbeafe', stroke: '#3b82f6' };
      case 'PENDIENTE_FUTURO':
      default:                return { fill: '#f9fafb', stroke: '#d1d5db' };
    }
  }

  // ── Helpers para plantilla ───────────────────────────────────────────────────

  nodosActivos(): NodoMonitorInfo[] {
    return Object.values(this.stats()?.nodos ?? {}).filter((n) => n.tramitesActivos > 0);
  }

  viendoTramite(): boolean {
    return !!this.tramiteSeleccionado();
  }

  duracionTexto(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}
