import { Component } from '@angular/core';
import { TramitesListaComponent } from '../../gestor/tramites/tramites-lista.component';

@Component({
  selector: 'app-admin-tramites',
  standalone: true,
  imports: [TramitesListaComponent],
  templateUrl: './tramites.component.html',
  styleUrl: './tramites.component.scss',
})
export class TramitesComponent {}
