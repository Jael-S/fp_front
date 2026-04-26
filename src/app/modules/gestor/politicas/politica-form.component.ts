import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Politica } from '../../../core/models/politica.model';

@Component({
  selector: 'app-politica-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './politica-form.component.html',
  styleUrl: './politica-form.component.scss',
})
export class PoliticaFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PoliticaFormComponent>);
  private readonly dialogData = inject<{ politica?: Politica } | null>(MAT_DIALOG_DATA, { optional: true });
  readonly data = this.dialogData ?? {};

  readonly form = this.fb.group({
    nombre: [this.data?.politica?.nombre ?? '', [Validators.required]],
    descripcion: [this.data?.politica?.descripcion ?? ''],
    diagramaJson: [this.data?.politica?.diagramaJson ?? ''],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
