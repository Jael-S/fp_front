import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EjecucionService } from '../../../core/services/ejecucion.service';
import { Ejecucion } from '../../../core/models/ejecucion.model';

@Component({
  selector: 'app-funcionario-mis-tareas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-tareas.component.html',
  styleUrl: './mis-tareas.component.scss',
})
export class MisTareasComponent {
  private readonly service = inject(EjecucionService);
  private readonly router = inject(Router);
  readonly rows = signal<Ejecucion[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.service.misTareas().subscribe((data) => this.rows.set(data));
  }

  ejecutar(id: string): void {
    this.router.navigate(['/funcionario/ejecutar-tarea', id]);
  }
}
