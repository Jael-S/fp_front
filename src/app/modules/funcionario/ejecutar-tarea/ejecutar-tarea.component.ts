import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Campo, Formulario } from '../../../core/models/formulario.model';
import { Ejecucion } from '../../../core/models/ejecucion.model';
import { EjecucionService } from '../../../core/services/ejecucion.service';
import { FormularioService } from '../../../core/services/formulario.service';

@Component({
  selector: 'app-ejecutar-tarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ejecutar-tarea.component.html',
  styleUrl: './ejecutar-tarea.component.scss',
})
export class EjecutarTareaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ejecucionService = inject(EjecucionService);
  private readonly formularioService = inject(FormularioService);
  private readonly fb = inject(FormBuilder);
  readonly form = new FormGroup<Record<string, FormControl<unknown>>>({
    observaciones: new FormControl<string>('', { nonNullable: true }),
  });
  readonly ejecucion = signal<Ejecucion | null>(null);
  readonly formulario = signal<Formulario | null>(null);
  readonly files = signal<Record<string, File[]>>({});
  readonly loading = signal(false);
  readonly campos = computed(() => this.formulario()?.campos ?? []);

  constructor() {
    this.load();
  }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.ejecucionService.getById(id).subscribe({
      next: (ejecucion: Ejecucion) => {
        this.ejecucion.set(ejecucion);
        this.formularioService.getByNodoId(ejecucion.nodoId).subscribe({
          next: (forms) => {
            const form = forms[0] ?? null;
            this.formulario.set(form);
            this.setupDynamicControls(form?.campos ?? []);
            this.loading.set(false);
          },
          error: () => {
            this.formulario.set(null);
            this.loading.set(false);
          },
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private setupDynamicControls(campos: Campo[]): void {
    campos.forEach((c) => {
      const control = new FormControl<string | boolean | null>(null, c.requerido ? Validators.required : []);
      this.form.addControl(c.nombre, control);
    });
  }

  submit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || this.form.invalid) return;
    const payload: Record<string, unknown> = {};
    this.campos().forEach((c) => {
      payload[c.nombre] = this.form.get(c.nombre)?.value ?? null;
    });
    const observaciones = this.form.get('observaciones')?.value as string | null | undefined;
    if (observaciones) {
      payload['observaciones'] = observaciones;
    }
    const archivos = Object.values(this.files()).flat();
    this.ejecucionService.completar(id, payload, archivos).subscribe(() => {
      this.router.navigate(['/funcionario/mis-tareas']);
    });
  }

  rechazar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const obs = ((this.form.get('observaciones')?.value as string | null | undefined) ?? '').trim();
    if (!id || !obs) {
      window.alert('Debe ingresar observaciones para rechazar.');
      return;
    }
    this.ejecucionService.rechazar(id, obs).subscribe(() => {
      this.router.navigate(['/funcionario/mis-tareas']);
    });
  }

  onFileSelect(campoNombre: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];
    this.files.update((prev) => ({ ...prev, [campoNombre]: list }));
  }

  isImage(campo: Campo): boolean {
    return campo.tipo === 'IMAGEN';
  }
}
