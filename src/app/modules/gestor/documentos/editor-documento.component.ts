import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentoService } from '../../../core/services/documento.service';

@Component({
  selector: 'app-editor-documento',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="editor-wrap">

      <!-- Barra superior -->
      <div class="editor-bar">
        <button class="btn-back" (click)="volver()">
          <i class="fas fa-arrow-left"></i>
          Volver
        </button>
        <span class="editor-titulo">
          <i class="fas fa-file-alt"></i>
          {{ tituloDoc }}
        </span>
        <span class="editor-modo" [class.modo-edit]="modo === 'edit'" [class.modo-view]="modo === 'view'">
          <i class="fas" [class.fa-pencil-alt]="modo === 'edit'" [class.fa-eye]="modo === 'view'"></i>
          {{ modo === 'edit' ? 'Editando' : 'Visualizando' }}
        </span>
      </div>

      <!-- Estado: cargando -->
      <div class="editor-estado" *ngIf="cargando">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Cargando editor...</p>
      </div>

      <!-- Estado: error -->
      <div class="editor-estado editor-error" *ngIf="error && !cargando">
        <i class="fas fa-exclamation-circle fa-2x"></i>
        <p>{{ error }}</p>
        <button class="btn-back" (click)="volver()">Volver a documentos</button>
      </div>

      <!-- Contenedor OnlyOffice -->
      <div id="onlyoffice-container"
           [style.display]="cargando || error ? 'none' : 'block'"
           class="onlyoffice-container">
      </div>

    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; min-height: 0; }

    .editor-wrap {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: var(--bg-main, #f8fafc);
    }

    /* ── Barra superior ── */
    .editor-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 20px;
      height: 52px;
      flex-shrink: 0;
      background: var(--card-bg, #fff);
      border-bottom: 1px solid var(--border-soft, #e2e8f0);
      box-shadow: 0 1px 3px rgba(0,0,0,.05);
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: var(--card-bg, #fff);
      color: #475569;
      border: 1px solid var(--border-soft, #e2e8f0);
      border-radius: 7px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all .15s;
      white-space: nowrap;
    }
    .btn-back:hover {
      background: var(--primary-soft, #eef2ff);
      border-color: var(--primary, #4f46e5);
      color: var(--primary, #4f46e5);
    }

    .editor-titulo {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .editor-titulo i { color: var(--primary, #4f46e5); flex-shrink: 0; }

    .editor-modo {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      white-space: nowrap;
    }
    .modo-edit { background: #d1fae5; color: #059669; }
    .modo-view { background: #dbeafe; color: #1d4ed8; }

    /* ── Estados ── */
    .editor-estado {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 16px;
      color: #94a3b8;
    }
    .editor-estado p { margin: 0; font-size: 14px; }
    .editor-error { color: var(--danger, #ef4444); }

    /* ── Contenedor OnlyOffice ── */
    .onlyoffice-container {
      flex: 1;
      min-height: 0;
      width: 100%;
    }
  `]
})
export class EditorDocumentoComponent implements OnInit, OnDestroy {

  documentoId = '';
  modo: 'edit' | 'view' = 'edit';
  tituloDoc = 'Editor de documentos';
  cargando = true;
  error: string | null = null;

  private editor: any;
  private scriptUrl = '';
  private scriptElem: HTMLScriptElement | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentoService: DocumentoService
  ) {}

  ngOnInit(): void {
    this.documentoId = this.route.snapshot.paramMap.get('documentoId') ?? '';

    const modoParam = this.route.snapshot.queryParamMap.get('modo');
    if (modoParam === 'edit' || modoParam === 'view') this.modo = modoParam;

    if (!this.documentoId) {
      this.error = 'No se especificó un documento.';
      this.cargando = false;
      return;
    }

    this.cargarConfig();
  }

  private cargarConfig(): void {
    this.documentoService.obtenerConfigOnlyOffice(this.documentoId, this.modo).subscribe({
      next: (config) => {
        this.tituloDoc = config.document?.title ?? 'Editor';
        this.scriptUrl = config.scriptUrl;
        if (!this.scriptUrl) {
          this.error = 'El servidor no devolvió la URL del script de OnlyOffice.';
          this.cargando = false;
          return;
        }
        this.inyectarScriptYAbrir(config);
      },
      error: () => {
        this.error = 'Error al obtener la configuración del documento desde el servidor.';
        this.cargando = false;
      }
    });
  }

  private inyectarScriptYAbrir(config: any): void {
    // Si DocsAPI ya está disponible (navegación anterior), inicializar directamente
    if ((window as any).DocsAPI) {
      this.inicializarEditor(config);
      return;
    }

    // Si el script ya fue insertado en el DOM, esperar a que cargue
    const scriptExistente = document.querySelector(`script[src="${this.scriptUrl}"]`);
    if (scriptExistente) {
      this.pollInterval = setInterval(() => {
        if ((window as any).DocsAPI) {
          clearInterval(this.pollInterval!);
          this.pollInterval = null;
          this.inicializarEditor(config);
        }
      }, 200);
      return;
    }

    // Insertar el script de OnlyOffice desde la URL del servidor (cloud o local)
    const script = document.createElement('script');
    script.src = this.scriptUrl;
    script.onload = () => this.inicializarEditor(config);
    script.onerror = () => {
      const host = (() => { try { return new URL(this.scriptUrl).host; } catch { return this.scriptUrl; } })();
      this.error = `No se pudo cargar OnlyOffice desde ${host}. Verifica que el servidor esté disponible.`;
      this.cargando = false;
    };
    this.scriptElem = script;
    document.head.appendChild(script);
  }

  private inicializarEditor(config: any): void {
    this.cargando = false;
    try {
      // scriptUrl es solo para el frontend — no se pasa al DocEditor
      const { scriptUrl, ...editorConfig } = config;
      this.editor = new (window as any).DocsAPI.DocEditor('onlyoffice-container', {
        ...editorConfig,
        height: '100%',
        width: '100%',
        events: {
          onDocumentStateChange: (e: any) => {
            if (e.data) console.log('[OnlyOffice] Cambio detectado — guardado pendiente');
          },
          onError: (e: any) => {
            console.error('[OnlyOffice] Error del editor:', e.data);
          }
        }
      });
    } catch (e) {
      this.error = 'Error al inicializar el editor OnlyOffice.';
    }
  }

  volver(): void {
    const back = this.route.snapshot.queryParamMap.get('back');
    back ? this.router.navigateByUrl(back) : this.router.navigate(['/gestor/documentos']);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    try { this.editor?.destroyEditor(); } catch (_) {}
    // Limpiar el script del DOM usando la referencia exacta almacenada
    if (this.scriptElem) {
      this.scriptElem.remove();
      this.scriptElem = null;
      delete (window as any).DocsAPI;
    }
  }
}
