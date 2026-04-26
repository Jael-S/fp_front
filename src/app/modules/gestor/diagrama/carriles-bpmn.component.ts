import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, inject } from '@angular/core';
import { DiagramaBpmnService } from '../../../core/services/diagrama-bpmn.service';

@Component({
  selector: 'app-carriles-bpmn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carriles-bpmn.component.html',
  styleUrl: './carriles-bpmn.component.scss',
})
export class CarrilesBpmnComponent implements AfterViewInit, OnDestroy {
  private readonly diagrama = inject(DiagramaBpmnService);

  @Input({ required: true }) propertiesPanelHost!: HTMLElement;

  @ViewChild('canvasHost') private canvasHostRef!: ElementRef<HTMLDivElement>;

  get canvasHost(): HTMLElement {
    return this.canvasHostRef?.nativeElement;
  }

  ngAfterViewInit(): void {
    this.diagrama.init({
      canvas: this.canvasHostRef.nativeElement,
      propertiesPanel: this.propertiesPanelHost,
    });
  }

  ngOnDestroy(): void {
    this.diagrama.destroy();
  }
}

