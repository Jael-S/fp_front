import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TramiteService } from '../../../core/services/tramite.service';
import { Tramite } from '../../../core/models/tramite.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss',
})
export class HistorialComponent {
  private readonly tramiteService = inject(TramiteService);
  readonly rows = signal<Tramite[]>([]);

  constructor() {
    this.tramiteService.misTramites(0, 20).subscribe((res) => this.rows.set(res.items));
  }
}
