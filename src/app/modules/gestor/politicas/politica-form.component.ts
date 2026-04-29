import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Politica } from '../../../core/models/politica.model';
import { IaService } from '../../../core/services/ia.service';

@Component({
  selector: 'app-politica-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './politica-form.component.html',
  styleUrl: './politica-form.component.scss',
})
export class PoliticaFormComponent {
  private readonly fb         = inject(FormBuilder);
  private readonly dialogRef  = inject(MatDialogRef<PoliticaFormComponent>);
  private readonly dialogData = inject<{ politica?: Politica } | null>(MAT_DIALOG_DATA, { optional: true });
  private readonly iaService  = inject(IaService);

  readonly data = this.dialogData ?? {};

  readonly form = this.fb.group({
    nombre:       [this.data?.politica?.nombre ?? '',       [Validators.required]],
    descripcion:  [this.data?.politica?.descripcion ?? ''],
    diagramaJson: [this.data?.politica?.diagramaJson ?? ''],
  });

  readonly generando     = signal(false);
  readonly escuchando    = signal(false);
  readonly tareasIA      = signal<string[]>([]);
  readonly mensajeIA     = signal('');

  // ── Guardar ────────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  // ── Reconocimiento de voz (continuo con interim) ─────────────────────────

  private recognition: any = null;

  iniciarGrabacion(): void {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.mensajeIA.set('Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
      return;
    }

    // Si ya está escuchando, detener
    if (this.escuchando()) {
      this.recognition?.stop();
      return;
    }

    this.recognition = new SpeechRecognitionCtor();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = true;       // no para al detectar silencio corto
    this.recognition.interimResults = true;   // muestra texto mientras hablas

    this.escuchando.set(true);
    this.mensajeIA.set('Escuchando... describe el proceso. Haz clic de nuevo para detener.');

    this.recognition.onresult = (event: any) => {
      let texto = '';
      for (let i = 0; i < event.results.length; i++) {
        texto += event.results[i][0].transcript;
      }
      this.form.get('descripcion')?.setValue(texto);
      // Mensaje interino vs final
      const esFinal = event.results[event.results.length - 1]?.isFinal;
      this.mensajeIA.set(esFinal ? `✓ Capturado: "${texto.slice(0, 80)}..."` : '🎤 Escuchando...');
    };

    this.recognition.onerror = (event: any) => {
      const msg = event.error === 'no-speech' ? 'No se detectó voz. Intenta de nuevo.' : `Error: ${event.error}`;
      this.mensajeIA.set(msg);
      this.escuchando.set(false);
    };

    this.recognition.onend = () => {
      this.escuchando.set(false);
    };

    this.recognition.start();
  }

  // ── Generación de diagrama por IA ─────────────────────────────────────────

  generarDiagramaConIA(): void {
    const descripcion = this.form.get('descripcion')?.value?.trim();
    if (!descripcion) {
      this.mensajeIA.set('Escribe o graba una descripción del proceso primero.');
      return;
    }

    this.generando.set(true);
    this.mensajeIA.set('Generando diagrama...');
    this.tareasIA.set([]);

    this.iaService.generarDiagrama(descripcion).subscribe({
      next: (res) => {
        this.form.get('diagramaJson')?.setValue(res.diagramaXml);
        this.tareasIA.set(res.tareasDetectadas);
        this.mensajeIA.set(`¡Diagrama generado con ${res.tareasDetectadas.length} tarea(s)! Guarda la política para verlo en el diagramador.`);
        this.generando.set(false);
      },
      error: (err) => {
        this.mensajeIA.set(err?.error?.message ?? 'Error al generar el diagrama.');
        this.generando.set(false);
      },
    });
  }
}
