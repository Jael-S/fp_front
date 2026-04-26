import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EjecucionService } from '../../../core/services/ejecucion.service';

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
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    observaciones: ['', Validators.required],
  });

  submit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || this.form.invalid) return;

    this.ejecucionService.completar(id, { observaciones: this.form.value.observaciones }, []).subscribe(() => {
      this.router.navigate(['/funcionario/mis-tareas']);
    });
  }
}
