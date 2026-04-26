import { Component } from '@angular/core';
import { DepartamentosListaComponent } from './departamentos-lista.component';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [DepartamentosListaComponent],
  templateUrl: './departamentos.component.html',
  styleUrl: './departamentos.component.scss',
})
export class DepartamentosComponent {}
