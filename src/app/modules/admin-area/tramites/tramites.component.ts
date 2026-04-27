import { Component } from '@angular/core';
import { TramitesComponent as GestorTramitesComponent } from '../../gestor/tramites/tramites.component';

@Component({
  selector: 'app-admin-tramites',
  standalone: true,
  imports: [GestorTramitesComponent],
  templateUrl: './tramites.component.html',
  styleUrl: './tramites.component.scss',
})
export class TramitesComponent {}
