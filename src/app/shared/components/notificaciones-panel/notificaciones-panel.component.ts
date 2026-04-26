import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Notificacion } from '../../../core/models/notificacion.model';
import { NotificacionService } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-notificaciones-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones-panel.component.html',
  styleUrl: './notificaciones-panel.component.scss',
})
export class NotificacionesPanelComponent {
  private readonly service = inject(NotificacionService);
  readonly rows = signal<Notificacion[]>([]);

  constructor() {
    this.service.list(0, 20).subscribe((res) => this.rows.set(res.items));
  }
}
