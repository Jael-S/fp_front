import { Injectable, inject } from '@angular/core';
import { DiagramaBpmnService } from '../../../core/services/diagrama-bpmn.service';

/**
 * Wrapper de acciones de edición (bpmn-js ya soporta drag/drop y teclas).
 * Este servicio centraliza comandos que el UI necesite invocar.
 */
@Injectable({ providedIn: 'root' })
export class DragDropService {
  private readonly diagrama = inject(DiagramaBpmnService);

  deleteSelection(): void {
    const sel = this.diagrama.selected();
    if (!sel) return;
    this.diagrama.removeElement(sel.id);
  }
}

