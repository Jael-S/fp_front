import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoliticaService } from '../../../core/services/politica.service';
import type { Politica } from '../../../core/models/politica.model';
import { DiagramaBpmnService, type ValidationIssue } from '../../../core/services/diagrama-bpmn.service';
import { PaletaHerramientasComponent } from './paleta-herramientas.component';
import { PanelPropiedadesComponent } from './panel-propiedades.component';
import { CarrilesBpmnComponent } from './carriles-bpmn.component';

@Component({
  selector: 'app-diagrama-editor',
  standalone: true,
  imports: [CommonModule, PaletaHerramientasComponent, PanelPropiedadesComponent, CarrilesBpmnComponent],
  templateUrl: './diagrama-editor.component.html',
  styleUrl: './diagrama-editor.component.scss',
})
export class DiagramaEditorComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly politicaService = inject(PoliticaService);
  private readonly diagrama = inject(DiagramaBpmnService);

  @ViewChild('propertiesHost') private propertiesHostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasExportHost') private canvasExportHostRef!: ElementRef<HTMLDivElement>;

  readonly politica = signal<Politica | null>(null);
  readonly isSaving = signal(false);
  readonly issues = signal<ValidationIssue[]>([]);
  readonly politicaId = signal<string | null>(null);
  readonly selected = this.diagrama.selected;

  async ngAfterViewInit(): Promise<void> {
    const politicaId = this.route.snapshot.paramMap.get('politicaId');
    if (!politicaId) {
      window.alert('politicaId requerido');
      this.router.navigate(['/gestor/politicas']);
      return;
    }
    this.politicaId.set(politicaId);

    this.politicaService.getById(politicaId).subscribe({
      next: async (p) => {
        this.politica.set(p);
        try {
          const xml = this.diagrama.toBpmnXml(p.diagramaJson);
          // El modeler se inicializa dentro del CarrilesBpmnComponent (ngAfterViewInit)
          // pero el XML se puede importar aquí apenas el view ya existe.
          await this.diagrama.importXml(xml);
          this.issues.set([]);
        } catch (e) {
          window.alert('No se pudo cargar el diagrama BPMN. Se cargará un diagrama nuevo.');
          await this.diagrama.importXml(this.diagrama.defaultXml());
          this.issues.set([]);
        }
      },
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo cargar la politica'),
    });
  }

  validate(): boolean {
    const issues = this.diagrama.validate();
    this.issues.set(issues);
    const hasErrors = issues.some((i) => i.level === 'ERROR');
    if (hasErrors) window.alert('El diagrama tiene errores. Revisa la lista de validación.');
    return !hasErrors;
  }

  async save(): Promise<void> {
    const politica = this.politica();
    if (!politica) return;
    if (!this.validate()) return;

    this.isSaving.set(true);
    try {
      const xml = await this.diagrama.exportXml(true);
      const payload = {
        nombre: politica.nombre,
        descripcion: politica.descripcion,
        diagramaJson: xml || null,
      };
      this.politicaService.update(politica.id, payload).subscribe({
        next: (updated) => {
          this.politica.set(updated);
          window.alert('Diagrama guardado');
          this.isSaving.set(false);
        },
        error: (err) => {
          this.isSaving.set(false);
          window.alert(err?.error?.message ?? 'No se pudo guardar el diagrama');
        },
      });
    } catch {
      this.isSaving.set(false);
      window.alert('No se pudo exportar el diagrama');
    }
  }

  zoomIn(): void {
    this.diagrama.zoomIn();
  }
  zoomOut(): void {
    this.diagrama.zoomOut();
  }
  resetView(): void {
    this.diagrama.fitViewport();
  }

  async exportPng(): Promise<void> {
    const host = this.canvasExportHostRef?.nativeElement;
    if (!host) return;
    const dataUrl = await this.diagrama.exportPngDataUrl(host);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `diagrama-${this.politicaId() ?? 'politica'}.png`;
    a.click();
  }

  async exportPdf(): Promise<void> {
    const host = this.canvasExportHostRef?.nativeElement;
    if (!host) return;
    await this.diagrama.exportPdf(host, `diagrama-${this.politicaId() ?? 'politica'}.pdf`);
  }

  autoLayout(): void {
    // Placeholder: bpmn-js no trae auto-layout sin plugin extra.
    // Mantengo el botón para completar el UI; luego podemos integrar un layout engine si lo deseas.
    window.alert('Auto Layout: pendiente de integrar motor de layout.');
  }

  onPropsSaved(): void {
    // limpia issues para que se regenere al validar/guardar
    this.issues.set([]);
  }
}
