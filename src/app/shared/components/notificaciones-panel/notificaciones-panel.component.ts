import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
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
  @Input() items: Notificacion[] | null = null;
  @Output() readOne = new EventEmitter<string>();

  constructor() {
    this.service.list(0, 20).subscribe((res) => this.rows.set(res.items));
  }

  toRender(): Notificacion[] {
    return this.items ?? this.rows();
  }

  mark(item: Notificacion): void {
    this.readOne.emit(item.id);
  }
}
