import { Component } from '@angular/core';
import { PoliticasListaComponent } from './politicas-lista.component';

@Component({
  selector: 'app-politicas',
  standalone: true,
  imports: [PoliticasListaComponent],
  templateUrl: './politicas.component.html',
  styleUrl: './politicas.component.scss',
})
export class PoliticasComponent {}
