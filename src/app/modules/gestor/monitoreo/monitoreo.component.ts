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
// @ts-ignore
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

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

  private viewer: any = null;
  private diagramaXmlActual: string | null = null;

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
    try { this.viewer?.destroy(); } finally { this.viewer = null; }
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
      // Volver a la vista general de política
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
      next: async ({ politica, monitor, tramites }) => {
        this.stats.set(monitor);
        this.tramites.set(tramites.items ?? []);
        this.diagramaXmlActual = politica.diagramaJson ?? null;
        this.loading.set(false);
        await this.renderizarDiagrama(this.diagramaXmlActual);
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
        this.limpiarOverlays();
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
          this.limpiarOverlays();
          this.aplicarColoresGenerales(monitor);
        }
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // ── bpmn-js viewer ───────────────────────────────────────────────────────────

  private initViewer(): void {
    this.viewer = new NavigatedViewer({ container: '#bpmn-monitor' });
  }

  private async renderizarDiagrama(xml: string | null): Promise<void> {
    if (!this.viewer || !xml?.trim()) return;
    try {
      await this.viewer.importXML(xml);
      (this.viewer.get('canvas') as any).zoom('fit-viewport');
    } catch { /* XML inválido */ }
  }

  // Coloreo vista general (todos los trámites de la política)
  private aplicarColoresGenerales(monitor: MonitorData | null): void {
    if (!monitor) return;
    for (const info of Object.values(monitor.nodos ?? {})) {
      this.colorearNodo(info.elementId, info.estado);
      if (info.tramitesActivos > 0) this.agregarBadge(info.elementId, info.tramitesActivos);
    }
  }

  // Coloreo vista trámite (3 colores: verde=completado, amarillo=actual, gris=futuro)
  private aplicarColoresTramite(data: TramiteMonitorData): void {
    for (const [elementId, estado] of Object.entries(data.estadoNodos ?? {})) {
      this.colorearNodoPorEstadoTramite(elementId, estado);
    }
  }

  private colorearNodo(elementId: string, estado: string): void {
    try {
      const element = (this.viewer.get('elementRegistry') as any).get(elementId);
      if (!element) return;
      const gfx = (this.viewer.get('canvas') as any).getGraphics(element) as SVGGElement;
      const shape = gfx?.querySelector<SVGElement>(
        '.djs-visual > rect, .djs-visual > circle, .djs-visual > polygon, .djs-visual > ellipse'
      );
      if (!shape) return;
      const { fill, stroke } = this.colorGeneral(estado);
      shape.setAttribute('fill', fill);
      shape.setAttribute('stroke', stroke);
      shape.setAttribute('stroke-width', '2.5');
    } catch { /* ignorar */ }
  }

  private colorearNodoPorEstadoTramite(elementId: string, estado: string): void {
    try {
      const element = (this.viewer.get('elementRegistry') as any).get(elementId);
      if (!element) return;
      const gfx = (this.viewer.get('canvas') as any).getGraphics(element) as SVGGElement;
      const shape = gfx?.querySelector<SVGElement>(
        '.djs-visual > rect, .djs-visual > circle, .djs-visual > polygon, .djs-visual > ellipse'
      );
      if (!shape) return;
      const { fill, stroke } = this.colorTramite(estado);
      shape.setAttribute('fill', fill);
      shape.setAttribute('stroke', stroke);
      shape.setAttribute('stroke-width', estado === 'EN_PROCESO' ? '3' : '2');
    } catch { /* ignorar */ }
  }

  private agregarBadge(elementId: string, count: number): void {
    try {
      const overlays = this.viewer.get('overlays') as any;
      overlays.remove({ element: elementId, type: 'monitor-count' });
      overlays.add(elementId, 'monitor-count', {
        position: { top: -14, right: -14 },
        html: `<div class="bpmn-monitor-badge">${count}</div>`,
      });
    } catch { /* ignorar */ }
  }

  private limpiarOverlays(): void {
    try { (this.viewer.get('overlays') as any).remove({ type: 'monitor-count' }); }
    catch { /* ignorar */ }
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
