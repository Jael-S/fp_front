import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Politica } from '../../../core/models/politica.model';

@Component({
  selector: 'app-politica-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule, MatButtonModule],
  templateUrl: './politica-form.component.html',
  styleUrl: './politica-form.component.scss',
})
export class PoliticaFormComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PoliticaFormComponent>);
  private readonly dialogData = inject<{ politica?: Politica } | null>(MAT_DIALOG_DATA, { optional: true });

  readonly data = this.dialogData ?? {};

  readonly form = this.fb.group({
    nombre:      [this.data?.politica?.nombre ?? '',  [Validators.required]],
    descripcion: [this.data?.politica?.descripcion ?? ''],
    diagramaJson:[this.data?.politica?.diagramaJson ?? ''],
  });

  etiquetas: string[] = [...(this.data?.politica?.etiquetas ?? [])];
  nuevaEtiqueta = '';

  requisitosObligatorios: string[] = [...(this.data?.politica?.requisitosObligatorios ?? [])];
  nuevoObligatorio = '';

  requisitosOpcionales: string[] = [...(this.data?.politica?.requisitosOpcionales ?? [])];
  nuevoOpcional = '';

  // ─── Etiquetas ────────────────────────────────────────────────────────────

  agregarEtiqueta(): void {
    const val = this.nuevaEtiqueta.trim();
    if (val && !this.etiquetas.includes(val)) {
      this.etiquetas = [...this.etiquetas, val];
    }
    this.nuevaEtiqueta = '';
  }

  quitarEtiqueta(tag: string): void {
    this.etiquetas = this.etiquetas.filter(e => e !== tag);
  }

  onEtiquetaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.agregarEtiqueta();
    }
  }

  // ─── Requisitos Obligatorios ──────────────────────────────────────────────

  agregarObligatorio(): void {
    const val = this.nuevoObligatorio.trim();
    if (val && !this.requisitosObligatorios.includes(val)) {
      this.requisitosObligatorios = [...this.requisitosObligatorios, val];
    }
    this.nuevoObligatorio = '';
  }

  quitarObligatorio(req: string): void {
    this.requisitosObligatorios = this.requisitosObligatorios.filter(r => r !== req);
  }

  onObligatorioKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregarObligatorio();
    }
  }

  // ─── Requisitos Opcionales ────────────────────────────────────────────────

  agregarOpcional(): void {
    const val = this.nuevoOpcional.trim();
    if (val && !this.requisitosOpcionales.includes(val)) {
      this.requisitosOpcionales = [...this.requisitosOpcionales, val];
    }
    this.nuevoOpcional = '';
  }

  quitarOpcional(req: string): void {
    this.requisitosOpcionales = this.requisitosOpcionales.filter(r => r !== req);
  }

  onOpcionalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregarOpcional();
    }
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      nombre:      raw.nombre,
      descripcion: raw.descripcion,
      diagramaJson: raw.diagramaJson || null,
      etiquetas:   this.etiquetas.length ? this.etiquetas : null,
      requisitosObligatorios: this.requisitosObligatorios.length ? this.requisitosObligatorios : null,
      requisitosOpcionales:   this.requisitosOpcionales.length ? this.requisitosOpcionales : null,
    });
  }
}
