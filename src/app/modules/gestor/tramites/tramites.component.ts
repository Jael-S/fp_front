import { Component } from '@angular/core';
import { TramitesListaComponent } from './tramites-lista.component';

@Component({
  selector: 'app-tramites',
  standalone: true,
  imports: [TramitesListaComponent],
  templateUrl: './tramites.component.html',
  styleUrl: './tramites.component.scss',
})
export class TramitesComponent {}
