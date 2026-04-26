import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../core/models/usuario.model';
import { Rol } from '../../../core/models/user.model';

@Component({
  selector: 'app-departamento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  templateUrl: './departamento-form.component.html',
  styleUrl: './departamento-form.component.scss',
})
export class DepartamentoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UsuarioService);
  private readonly dialogRef = inject(MatDialogRef<DepartamentoFormComponent>);
  private readonly dialogData = inject<{ departamento?: { nombre: string; descripcion?: string; responsableId: string } } | null>(
    MAT_DIALOG_DATA,
    { optional: true },
  );
  readonly data = this.dialogData ?? {};

  readonly admins = signal<Usuario[]>([]);

  readonly form = this.fb.group({
    nombre: [this.data?.departamento?.nombre ?? '', [Validators.required]],
    descripcion: [this.data?.departamento?.descripcion ?? ''],
    responsableId: [this.data?.departamento?.responsableId ?? '', [Validators.required]],
  });

  constructor() {
    // Carga robusta: si el backend no filtra por rol en query, filtramos en cliente.
    this.userService.list(0, 1000).subscribe((res) => {
      this.admins.set(
        res.items.filter((u) => {
          const role = String(u.rol ?? '').toUpperCase();
          return u.activo && role === Rol.ADMINISTRADOR_AREA;
        }),
      );
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
