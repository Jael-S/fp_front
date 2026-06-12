import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReporteService } from '../../../core/services/reporte.service';
import {
  GenerarReportePantallaResponse,
  InterpretarReporteResponse,
  ReporteCriterios,
  ReporteHistorialItem,
} from '../../../core/models/reporte.model';

const HISTORIAL_KEY = 'fp_reportes_historial';
const HISTORIAL_MAX = 10;

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly cdr = inject(ChangeDetectorRef);

  instruccion = '';
  respuestaPregunta = '';

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly interpretacion = signal<InterpretarReporteResponse | null>(null);
  readonly resultado = signal<GenerarReportePantallaResponse | null>(null);
  readonly historial = signal<ReporteHistorialItem[]>([]);

  // ─── Voz ─────────────────────────────────────────────────────────────────
  grabando = false;
  vozError = '';
  private recognition: any;

  constructor() {
    this.inicializarVoz();
    this.cargarHistorial();
  }

  private inicializarVoz(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const transcripcion = event.results[0][0].transcript;
      if (this.interpretacion()?.pregunta) {
        this.respuestaPregunta = transcripcion;
      } else {
        this.instruccion = transcripcion;
      }
      this.grabando = false;
      this.vozError = '';
      this.cdr.detectChanges();
    };

    this.recognition.onerror = (event: any) => {
      this.grabando = false;
      if (event.error !== 'no-speech') {
        this.vozError = 'No se pudo capturar el audio. Intenta de nuevo.';
      }
      this.cdr.detectChanges();
    };

    this.recognition.onend = () => {
      this.grabando = false;
      this.cdr.detectChanges();
    };
  }

  toggleVoz(): void {
    if (!this.recognition) {
      this.vozError = 'Tu navegador no soporta el reconocimiento de voz. Usa Chrome o Edge.';
      return;
    }
    this.vozError = '';
    if (this.grabando) {
      this.recognition.stop();
      this.grabando = false;
    } else {
      try {
        this.recognition.start();
        this.grabando = true;
      } catch {
        this.vozError = 'No se pudo iniciar el micrófono.';
      }
    }
  }

  // ─── Interpretación ──────────────────────────────────────────────────────

  interpretar(): void {
    const texto = this.instruccion.trim();
    if (!texto) return;

    this.cargando.set(true);
    this.error.set('');
    this.resultado.set(null);

    this.reporteService.interpretar(texto).subscribe({
      next: (res) => {
        this.interpretacion.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo interpretar la instrucción. Intenta nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  responderPregunta(): void {
    const respuesta = this.respuestaPregunta.trim();
    if (!respuesta) return;

    this.instruccion = `${this.instruccion}. ${respuesta}`;
    this.respuestaPregunta = '';
    this.interpretar();
  }

  // ─── Generación del reporte ──────────────────────────────────────────────

  generar(): void {
    const interp = this.interpretacion();
    if (!interp) return;

    this.cargando.set(true);
    this.error.set('');
    this.resultado.set(null);

    // Siempre se muestra primero la tabla en pantalla. Si el formato pedido
    // no es "pantalla", además se habilitan los botones de descarga.
    this.reporteService.generarEnPantalla(interp.datos, interp.criterios, 'pantalla').subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.cargando.set(false);
        this.guardarEnHistorial(interp.formato, interp.datos, interp.criterios);
      },
      error: () => {
        this.error.set('No se pudo generar el reporte.');
        this.cargando.set(false);
      },
    });
  }

  descargar(formato: 'excel' | 'word' | 'pdf'): void {
    const interp = this.interpretacion();
    if (!interp) return;

    this.cargando.set(true);
    this.error.set('');

    this.reporteService.generarArchivo(interp.datos, interp.criterios, formato).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, formato);
        this.cargando.set(false);
        this.guardarEnHistorial(formato, interp.datos, interp.criterios);
      },
      error: () => {
        this.error.set('No se pudo generar el archivo.');
        this.cargando.set(false);
      },
    });
  }

  private descargarArchivo(blob: Blob, formato: string): void {
    const extensiones: Record<string, string> = { excel: 'xlsx', word: 'docx', pdf: 'pdf' };
    const extension = extensiones[formato] ?? 'dat';
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte.${extension}`;
    enlace.click();
    window.URL.revokeObjectURL(url);
  }

  nuevaConsulta(): void {
    this.instruccion = '';
    this.respuestaPregunta = '';
    this.interpretacion.set(null);
    this.resultado.set(null);
    this.error.set('');
  }

  criteriosKeys(criterios: ReporteCriterios): string[] {
    return Object.keys(criterios ?? {});
  }

  // ─── Historial de reportes recientes ──────────────────────────────────────

  private cargarHistorial(): void {
    try {
      const guardado = localStorage.getItem(HISTORIAL_KEY);
      this.historial.set(guardado ? JSON.parse(guardado) : []);
    } catch {
      this.historial.set([]);
    }
  }

  private guardarEnHistorial(
    formato: ReporteHistorialItem['formato'],
    datos: string[],
    criterios: ReporteCriterios,
  ): void {
    const item: ReporteHistorialItem = {
      fecha: new Date().toISOString(),
      instruccion: this.instruccion.trim(),
      formato,
      datos,
      criterios,
    };

    const actualizado = [item, ...this.historial()].slice(0, HISTORIAL_MAX);
    this.historial.set(actualizado);
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(actualizado));
  }

  descargarDeNuevo(item: ReporteHistorialItem): void {
    if (item.formato === 'pantalla') return;

    this.cargando.set(true);
    this.error.set('');

    this.reporteService.generarArchivo(item.datos, item.criterios, item.formato).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, item.formato);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo generar el archivo.');
        this.cargando.set(false);
      },
    });
  }

  verEnPantalla(item: ReporteHistorialItem): void {
    this.cargando.set(true);
    this.error.set('');

    this.reporteService.generarEnPantalla(item.datos, item.criterios, 'pantalla').subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.interpretacion.set({
          datos: item.datos,
          criterios: item.criterios,
          formato: item.formato,
          pregunta: null,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo generar el reporte.');
        this.cargando.set(false);
      },
    });
  }

  eliminarDelHistorial(item: ReporteHistorialItem): void {
    const actualizado = this.historial().filter((h) => h !== item);
    this.historial.set(actualizado);
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(actualizado));
  }

  formatoEtiqueta(formato: string): string {
    const etiquetas: Record<string, string> = {
      excel: 'Excel',
      word: 'Word',
      pdf: 'PDF',
      pantalla: 'Pantalla',
    };
    return etiquetas[formato] ?? formato;
  }
}
