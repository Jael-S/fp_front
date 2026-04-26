import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CoberturaService } from '../../../core/services/cobertura.service';
import { PuntoCobertura } from '../../../core/models/cobertura.model';

@Component({
  selector: 'app-admin-mapa-cobertura',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-cobertura.component.html',
  styleUrl: './mapa-cobertura.component.scss',
})
export class MapaCoberturaComponent {
  private readonly service = inject(CoberturaService);
  readonly rows = signal<PuntoCobertura[]>([]);

  constructor() {
    this.service.list().subscribe((data) => this.rows.set(data));
  }
}
