import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Campo } from '../../../core/models/formulario.model';

@Component({
  selector: 'app-formulario-dinamico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-dinamico.component.html',
  styleUrl: './formulario-dinamico.component.scss',
})
export class FormularioDinamicoComponent {
  readonly campos = input<Campo[]>([]);
}
