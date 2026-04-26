import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import type { ValidationIssue } from '../../../core/services/diagrama-bpmn.service';

@Component({
  selector: 'app-paleta-herramientas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paleta-herramientas.component.html',
  styleUrl: './paleta-herramientas.component.scss',
})
export class PaletaHerramientasComponent {
  @Input({ required: true }) isSaving!: boolean;
  @Input({ required: true }) issues!: ValidationIssue[];

  @Output() readonly zoomIn = new EventEmitter<void>();
  @Output() readonly zoomOut = new EventEmitter<void>();
  @Output() readonly resetView = new EventEmitter<void>();
  @Output() readonly validate = new EventEmitter<void>();
  @Output() readonly save = new EventEmitter<void>();
  @Output() readonly exportPng = new EventEmitter<void>();
  @Output() readonly exportPdf = new EventEmitter<void>();
  @Output() readonly autoLayout = new EventEmitter<void>();

  readonly isIssuesOpen = signal(true);

  toggleIssues(): void {
    this.isIssuesOpen.set(!this.isIssuesOpen());
  }
}

