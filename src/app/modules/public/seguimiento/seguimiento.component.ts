import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicService } from '../../../core/services/public.service';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento.component.html',
  styleUrl: './seguimiento.component.scss',
})
export class SeguimientoComponent {
  private readonly publicService = inject(PublicService);

  readonly codigo = signal('');
  readonly loading = signal(false);
  readonly result = signal<Record<string, unknown> | null>(null);
  readonly error = signal('');

  consultar(): void {
    if (!this.codigo().trim()) {
      this.error.set('Ingrese un codigo de seguimiento.');
      this.result.set(null);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.publicService.seguimiento(this.codigo().trim()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se encontro seguimiento para ese codigo.');
        this.result.set(null);
        this.loading.set(false);
      },
    });
  }
}
