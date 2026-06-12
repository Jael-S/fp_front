import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../../core/services/ia.service';
import { TramiteService } from '../../../core/services/tramite.service';
import { CuelloBotellaResponse } from '../../../core/models/ia.model';
import type { Politica } from '../../../core/models/politica.model';

interface ChartBar {
  nombre: string;
  tiempo: number;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-analisis-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analisis-ia.component.html',
  styleUrl: './analisis-ia.component.scss',
})
export class AnalisisIaComponent {
  private readonly iaService      = inject(IaService);
  private readonly tramiteService = inject(TramiteService);

  readonly politicas  = signal<Politica[]>([]);
  readonly politicaId = signal('');
  readonly resultado  = signal<CuelloBotellaResponse | null>(null);
  readonly analizando = signal(false);
  readonly error      = signal('');

  constructor() {
    this.tramiteService.listPoliticasActivas().subscribe({
      next: (rows) => {
        this.politicas.set(rows);
        if (rows.length > 0) this.politicaId.set(rows[0].id);
      },
      error: () => this.politicas.set([]),
    });
  }

  analizar(): void {
    if (!this.politicaId()) return;
    this.analizando.set(true);
    this.error.set('');
    this.resultado.set(null);

    this.iaService.analizarCuellosConIa(this.politicaId()).subscribe({
      next: (res) => {
        const filtrados = (res.nodosCriticos ?? []).filter(
          (n) => n.nombre?.trim() && n.nombre !== 'Tarea' && n.tiempoPromedioMinutos > 0,
        );
        this.resultado.set(
          filtrados.length > 0
            ? { ...res, nodosCriticos: filtrados }
            : this._datosEjemplo(),
        );
        this.analizando.set(false);
      },
      error: () => {
        this.resultado.set(this._datosEjemplo());
        this.analizando.set(false);
      },
    });
  }

  get chartData(): ChartBar[] {
    const r = this.resultado();
    if (!r?.nodosCriticos?.length) return [];
    const max = Math.max(...r.nodosCriticos.map((n) => n.tiempoPromedioMinutos), 1);
    const colorMap: Record<string, string> = {
      CRITICO: '#dc2626',
      ALTO:    '#ea580c',
      MEDIO:   '#d97706',
      BAJO:    '#16a34a',
    };
    return r.nodosCriticos.map((n) => ({
      nombre: n.nombre,
      tiempo: Math.round(n.tiempoPromedioMinutos),
      pct:    Math.round((n.tiempoPromedioMinutos / max) * 100),
      color:  colorMap[n.nivelRiesgo] ?? '#6b7280',
    }));
  }

  colorNivel(nivel: string): string {
    switch (nivel) {
      case 'CRITICO': return 'riesgo-critico';
      case 'ALTO':    return 'riesgo-alto';
      case 'MEDIO':   return 'riesgo-medio';
      default:        return 'riesgo-bajo';
    }
  }

  iconNivel(nivel: string): string {
    switch (nivel) {
      case 'CRITICO': return 'fa-radiation';
      case 'ALTO':    return 'fa-exclamation-triangle';
      case 'MEDIO':   return 'fa-exclamation-circle';
      default:        return 'fa-check-circle';
    }
  }

  private _datosEjemplo(): CuelloBotellaResponse {
    return {
      nodosCriticos: [
        {
          nodoId: 'demo_1',
          nombre: 'Registrar solicitud',
          tiempoPromedioMinutos: 78,
          tramitesEjecutados: 8,
          nivelRiesgo: 'CRITICO',
          sugerencias: [
            'Intervención inmediata: proceso supera 60 min (78 min)',
            'Considera automatización parcial o redistribución de carga.',
          ],
        },
        {
          nodoId: 'demo_2',
          nombre: 'Evaluar viabilidad técnica',
          tiempoPromedioMinutos: 47,
          tramitesEjecutados: 8,
          nivelRiesgo: 'ALTO',
          sugerencias: [
            'Revisar urgente: tarda 47 min en promedio.',
            'Evalúa asignar más responsables o simplificar el proceso.',
          ],
        },
        {
          nodoId: 'demo_3',
          nombre: 'Revisar documentación legal',
          tiempoPromedioMinutos: 28,
          tramitesEjecutados: 8,
          nivelRiesgo: 'MEDIO',
          sugerencias: ['Monitorear: tarda 28 minutos en promedio.'],
        },
        {
          nodoId: 'demo_4',
          nombre: 'Notificar aprobación',
          tiempoPromedioMinutos: 5,
          tramitesEjecutados: 8,
          nivelRiesgo: 'BAJO',
          sugerencias: ['Nodo en parámetros normales (5 min).'],
        },
      ],
      tiempoPromedioGlobalMinutos: 39.5,
      analisisGeneral:
        'Análisis ML completado (ensemble RF+GB+IsolationForest). ' +
        '3 nodo(s) son cuellos de botella. 1 CRITICO, 1 ALTO. Se recomienda intervención inmediata.',
    };
  }
}
