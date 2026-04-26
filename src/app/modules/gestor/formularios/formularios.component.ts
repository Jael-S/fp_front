import { Component } from '@angular/core';
import { FormularioConstructorComponent } from './formulario-constructor.component';

@Component({
  selector: 'app-formularios',
  standalone: true,
  imports: [FormularioConstructorComponent],
  templateUrl: './formularios.component.html',
  styleUrl: './formularios.component.scss',
})
export class FormulariosComponent {}
