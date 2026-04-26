import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  loading = false;
  error = '';

  readonly form = this.fb.group({
    nombreEmpresa: ['', Validators.required],
    nombreAdmin: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService.registro(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/gestor/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'No se pudo registrar';
      },
    });
  }
}
