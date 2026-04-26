import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Rol } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;
  errorMessage = '';
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(email!, password!).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.rol === Rol.GESTOR_SISTEMA) {
          this.router.navigate(['/gestor']);
        } else if (response.rol === Rol.ADMINISTRADOR_AREA) {
          this.router.navigate(['/admin-area']);
        } else {
          this.router.navigate(['/funcionario']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message ?? 'Credenciales incorrectas';
      },
    });
  }
}

