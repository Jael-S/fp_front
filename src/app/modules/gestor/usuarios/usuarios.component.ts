import { Component } from '@angular/core';
import { UsuariosListaComponent } from './usuarios-lista.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [UsuariosListaComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {}
