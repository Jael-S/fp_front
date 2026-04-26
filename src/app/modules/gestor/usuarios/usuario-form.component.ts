import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { Usuario, UsuarioRequest, UsuarioUpdateRequest } from '../../../core/models/usuario.model';
import { Rol } from '../../../core/models/user.model';
import { Departamento } from '../../../core/models/departamento.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.scss',
})
export class UsuarioFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly depService = inject(DepartamentoService);
  private readonly dialogRef = inject(MatDialogRef<UsuarioFormComponent>);
  readonly data = inject<{ usuario?: Usuario }>(MAT_DIALOG_DATA);

  departamentos: Departamento[] = [];
  readonly roles = Object.values(Rol);
  readonly isEdit = !!this.data?.usuario;

  readonly form = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rol: [Rol.FUNCIONARIO, [Validators.required]],
    departamentoId: [''],
  });

  constructor() {
    if (this.isEdit && this.data.usuario) {
      this.form.patchValue({
        nombre: this.data.usuario.nombre,
        email: this.data.usuario.email,
        rol: this.data.usuario.rol,
        departamentoId: this.data.usuario.departamentoId ?? '',
      });
    } else {
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(6)]);
    }
    this.depService.list(0, 100).subscribe((res) => (this.departamentos = res.items));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (this.isEdit) {
      const payload: UsuarioUpdateRequest = {
        nombre: raw.nombre!,
        email: raw.email!,
        rol: raw.rol!,
        departamentoId: raw.departamentoId || null,
      };
      this.dialogRef.close(payload);
      return;
    }
    const payload: UsuarioRequest = {
      nombre: raw.nombre!,
      email: raw.email!,
      password: raw.password!,
      rol: raw.rol!,
      departamentoId: raw.departamentoId || null,
    };
    this.dialogRef.close(payload);
  }
}
