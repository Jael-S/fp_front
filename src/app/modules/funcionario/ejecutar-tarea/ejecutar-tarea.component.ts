import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  readonly form = new FormGroup<Record<string, FormControl<unknown>>>({
    observaciones: new FormControl<string>('', { nonNullable: true }),
  });

  readonly ejecucion    = signal<Ejecucion | null>(null);
  readonly formulario   = signal<Formulario | null>(null);
  readonly files        = signal<Record<string, File[]>>({});
  readonly gridData     = signal<Record<string, string[][]>>({});
  readonly loading      = signal(false);
  readonly submitting   = signal(false);
  readonly errorMsg     = signal<string | null>(null);
  readonly submitError  = signal<string | null>(null);
  readonly campos       = computed(() => this.formulario()?.campos ?? []);

  constructor() {
    this.load();
  }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    this.ejecucionService.getById(id).subscribe({
      next: (ejecucion: Ejecucion) => {
        this.ejecucion.set(ejecucion);
        if (!ejecucion.nodoId) {
          this.errorMsg.set('La tarea no tiene un nodo asociado.');
          this.loading.set(false);
          return;
        }
        this.formularioService.getByNodoId(ejecucion.nodoId).subscribe({
          next: (forms) => {
            const form = forms[0] ?? null;
            this.formulario.set(form);
            if (!form) this.errorMsg.set('sin_formulario');
            this.setupDynamicControls(form?.campos ?? []);
            this.loading.set(false);
          },
          error: (err) => {
            const status = err?.status;
            this.errorMsg.set(
              status === 401 ? 'Sin autorización para cargar el formulario. Intente recargar la página.'
              : status === 403 ? 'No tiene permiso para acceder a este formulario.'
              : 'No se pudo cargar el formulario. Intente nuevamente.'
            );
            this.formulario.set(null);
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.errorMsg.set(
          err?.status === 401 ? 'Sin autorización. Recargue la página.' : 'No se pudo cargar la tarea.'
        );
        this.loading.set(false);
      },
    });
  }

  private setupDynamicControls(campos: Campo[]): void {
    const grids: Record<string, string[][]> = {};
    campos.forEach((c) => {
      if (c.tipo === 'ETIQUETA') return;

      if (c.tipo === 'TABLA') {
        const filas = c.filasTabla ?? 1;
        const cols  = c.columnasTabla ?? 1;
        grids[c.nombre] = Array.from({ length: filas }, () => Array(cols).fill(''));
        return;
      }

      if (c.tipo === 'CHECKBOX') {
        // Checkbox es un booleano — valor inicial false, sin required (checked = sí, unchecked = no)
        this.form.addControl(c.nombre, new FormControl<boolean>(false));
        return;
      }

      if (c.tipo === 'ARCHIVO' || c.tipo === 'IMAGEN') {
        // FormControl oculto que se actualiza al seleccionar archivo
        this.form.addControl(
          c.nombre,
          new FormControl<string | null>(null, c.requerido ? Validators.required : [])
        );
        return;
      }

      const initial = c.tipo === 'RADIO' || c.tipo === 'SELECCION' ? '' : null;
      this.form.addControl(
        c.nombre,
        new FormControl<string | boolean | null>(initial, c.requerido ? Validators.required : [])
      );
    });
    this.gridData.set(grids);
  }

  onFileSelect(campoNombre: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];
    this.files.update((prev) => ({ ...prev, [campoNombre]: list }));
    // Actualizar el FormControl para que la validación required funcione
    const ctrl = this.form.get(campoNombre);
    if (ctrl) {
      ctrl.setValue(list.length > 0 ? list[0].name : null);
      ctrl.markAsTouched();
    }
  }

  getGridCell(campoNombre: string, fila: number, col: number): string {
    return this.gridData()[campoNombre]?.[fila]?.[col] ?? '';
  }

  setGridCell(campoNombre: string, fila: number, col: number, value: string): void {
    this.gridData.update((prev) => {
      const data = prev[campoNombre].map((r) => [...r]);
      data[fila][col] = value;
      return { ...prev, [campoNombre]: data };
    });
  }

  rangeArray(n: number | undefined): number[] {
    return Array.from({ length: n ?? 0 }, (_, i) => i);
  }

  getColumnaHeader(campo: Campo, i: number): string {
    return campo.columnasNombres?.[i] ?? `Col ${i + 1}`;
  }

  isImage(campo: Campo): boolean {
    return campo.tipo === 'IMAGEN';
  }

  isInvalid(nombre: string): boolean {
    const ctrl = this.form.get(nombre);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  submit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || this.submitting()) return;

    // Marcar todos los controles como touched para mostrar errores de validación
    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (this.form.invalid) {
      this.submitError.set('Completa los campos obligatorios antes de continuar.');
      return;
    }

    this.submitting.set(true);

    const payload: Record<string, unknown> = {};
    this.campos().forEach((c) => {
      if (c.tipo === 'ETIQUETA') return;
      if (c.tipo === 'TABLA') {
        payload[c.nombre] = this.gridData()[c.nombre] ?? [];
        return;
      }
      if (c.tipo === 'ARCHIVO' || c.tipo === 'IMAGEN') {
        // Los archivos se envían por separado, no en payload
        return;
      }
      payload[c.nombre] = this.form.get(c.nombre)?.value ?? null;
    });

    const observaciones = this.form.get('observaciones')?.value as string | null | undefined;
    if (observaciones) payload['observaciones'] = observaciones;

    const archivos = Object.values(this.files()).flat();
    this.ejecucionService.completar(id, payload, archivos).subscribe({
      next: () => this.router.navigate(['/funcionario/mis-tareas']),
      error: () => {
        this.submitting.set(false);
        this.submitError.set('No se pudo completar la tarea. Intente nuevamente.');
      },
    });
  }

  rechazar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const obs = ((this.form.get('observaciones')?.value as string | null | undefined) ?? '').trim();
    if (!id || !obs) {
      this.submitError.set('Debe ingresar observaciones para rechazar la tarea.');
      return;
    }
    this.ejecucionService.rechazar(id, obs).subscribe({
      next: () => this.router.navigate(['/funcionario/mis-tareas']),
      error: () => {
        this.submitError.set('No se pudo rechazar la tarea. Intente nuevamente.');
      },
    });
  }
}
