import { Component } from '@angular/core';
import { FormularioConstructorComponent } from '../../gestor/formularios/formulario-constructor.component';

@Component({
  selector: 'app-admin-formularios',
  standalone: true,
  imports: [FormularioConstructorComponent],
  templateUrl: './formularios.component.html',
  styleUrl: './formularios.component.scss',
})
export class FormulariosComponent {}
