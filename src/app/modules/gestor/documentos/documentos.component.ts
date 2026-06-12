import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentoService, DocumentoResponse } from '../../../core/services/documento.service';
import { AuthService } from '../../../core/services/auth.service';

interface TipoDoc {
  tipo: string;
  faIcon: string;
  etiqueta: string;
  color: string;
}

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="doc-page" (click)="cerrarDropdown()">

      <!-- CABECERA -->
      <div class="page-header">
        <div>
          <h1>Gestión Documental</h1>
          <p class="subtitle">{{ documentos.length }} documento(s) en el sistema</p>
        </div>
        <div class="header-actions">
          <div class="search-wrap">
            <i class="fas fa-search"></i>
            <input type="text" [(ngModel)]="filtroTexto" placeholder="Buscar documentos..."
                   (input)="filtrar()" class="search-in">
          </div>
          <button class="btn btn-secondary" (click)="abrirSubir(); $event.stopPropagation()">
            <i class="fas fa-upload"></i> Subir archivo
          </button>
          <div class="crear-wrap" (click)="$event.stopPropagation()">
            <button class="btn btn-primary" (click)="toggleDropdown()">
              <i class="fas fa-plus"></i>
              Crear documento
              <i class="fas fa-chevron-down chev" [class.chev-open]="mostrarDropdown"></i>
            </button>
            <div class="tipos-dropdown" *ngIf="mostrarDropdown">
              <p class="drop-label">Selecciona el tipo</p>
              <button *ngFor="let t of tiposDoc" class="tipo-row"
                      [disabled]="!!creandoTipo"
                      (click)="solicitarCrear(t)">
                <i [class]="'fas ' + t.faIcon" [style.color]="t.color"></i>
                <span class="tipo-nombre">{{ t.etiqueta }}</span>
                <span class="tipo-ext">.{{ t.tipo }}</span>
                <i class="fas fa-spinner fa-spin" *ngIf="creandoTipo === t.tipo"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ALERTAS -->
      <div class="alerta alerta-error" *ngIf="error">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
        <button class="close-alerta" (click)="error = null"><i class="fas fa-times"></i></button>
      </div>
      <div class="alerta alerta-exito" *ngIf="msgExito">
        <i class="fas fa-check-circle"></i>
        {{ msgExito }}
        <button class="close-alerta" (click)="msgExito = null"><i class="fas fa-times"></i></button>
      </div>

      <!-- TABLA DE DOCUMENTOS -->
      <div class="card">
        <div class="card-head">
          <div class="card-title-row">
            <i class="fas fa-folder-open card-icon"></i>
            <h2>Archivos</h2>
            <span class="badge-cnt">{{ documentosFiltrados.length }}</span>
          </div>
        </div>

        <div class="loading-row" *ngIf="cargando">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Cargando documentos...</span>
        </div>

        <div class="tabla-wrap" *ngIf="!cargando">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Versión</th>
                <th>Creado por</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doc of documentosFiltrados">
                <td class="td-nombre">
                  <i [class]="'fas ' + getIconoTipo(doc.tipoMime, doc.tipoDocumento)"
                     [style.color]="getColorTipo(doc.tipoDocumento)"></i>
                  <span class="doc-nombre-txt">{{ doc.nombre }}</span>
                  <span class="badge-oficina" *ngIf="doc.esDocumentoOficina">Oficina</span>
                </td>
                <td><span class="ext-badge">{{ getExtension(doc.nombre) || doc.tipoDocumento || '-' }}</span></td>
                <td class="td-muted">v{{ doc.version }}</td>
                <td class="td-muted">{{ doc.creadoPorNombre || '-' }}</td>
                <td class="td-muted">{{ doc.creadoEn | date:'dd/MM/yy HH:mm' }}</td>
                <td class="td-acc">
                  <button class="btn-ic btn-ic-primary" (click)="verDocumento(doc)" title="Ver / Descargar">
                    <i class="fas fa-external-link-alt"></i>
                  </button>
                  <button class="btn-ic btn-ic-edit" *ngIf="esEditable(doc)"
                          (click)="editarDocumento(doc)" title="Editar con OnlyOffice">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-ic btn-ic-muted" (click)="verAuditoria(doc)" title="Auditoría">
                    <i class="fas fa-history"></i>
                  </button>
                  <button class="btn-ic btn-ic-danger" (click)="eliminarDocumento(doc)" title="Eliminar">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="documentosFiltrados.length === 0">
                <td colspan="6" class="sin-datos">
                  <i class="fas fa-folder-open"></i>
                  <span>No hay documentos</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: Nombre del nuevo documento -->
      <div class="overlay" *ngIf="mostrarModalNombre" (click)="cancelarCrear()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>
              <i [class]="'fas ' + (tipoSeleccionado?.faIcon || 'fa-file')"></i>
              Nuevo {{ tipoSeleccionado?.etiqueta }}
            </h3>
            <button class="close-btn" (click)="cancelarCrear()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <label class="form-label">Nombre del documento</label>
            <input type="text" [(ngModel)]="nombreNuevoDoc"
                   placeholder="Ej: Informe mensual"
                   class="form-input"
                   (keyup.enter)="confirmarCrear()">
          </div>
          <div class="modal-foot">
            <button class="btn btn-secondary" (click)="cancelarCrear()">Cancelar</button>
            <button class="btn btn-primary" (click)="confirmarCrear()"
                    [disabled]="!nombreNuevoDoc.trim() || !!creandoTipo">
              <i class="fas fa-spinner fa-spin" *ngIf="creandoTipo"></i>
              {{ creandoTipo ? 'Creando...' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Subir archivo -->
      <div class="overlay" *ngIf="mostrarSubir" (click)="cerrarSubir()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3><i class="fas fa-upload"></i> Subir documento</h3>
            <button class="close-btn" (click)="cerrarSubir()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Archivo</label>
              <input type="file" (change)="onFileSelected($event)" class="form-input file-input">
            </div>
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" [(ngModel)]="nuevoNombre"
                     placeholder="Nombre del documento"
                     class="form-input">
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-secondary" (click)="cerrarSubir()">Cancelar</button>
            <button class="btn btn-primary" (click)="subirDocumento()"
                    [disabled]="!archivoSeleccionado || subiendo">
              <i class="fas fa-spinner fa-spin" *ngIf="subiendo"></i>
              {{ subiendo ? 'Subiendo...' : 'Subir' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Auditoría -->
      <div class="overlay" *ngIf="mostrarAuditoria" (click)="cerrarAuditoria()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3><i class="fas fa-history"></i> Auditoría — {{ docAuditoriaActual?.nombre }}</h3>
            <button class="close-btn" (click)="cerrarAuditoria()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="loading-row" *ngIf="cargandoAuditoria">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <table *ngIf="!cargandoAuditoria">
              <thead>
                <tr>
                  <th>Acción</th><th>Usuario</th><th>Detalles</th><th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of auditoria">
                  <td>{{ a.accion }}</td>
                  <td>{{ a.usuarioNombre }}</td>
                  <td>{{ a.detalles }}</td>
                  <td class="td-muted">{{ a.fechaHora | date:'dd/MM/yy HH:mm' }}</td>
                </tr>
                <tr *ngIf="auditoria.length === 0">
                  <td colspan="4" class="sin-datos">
                    <i class="fas fa-inbox"></i>
                    <span>Sin registros</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-foot">
            <button class="btn btn-secondary" (click)="cerrarAuditoria()">Cerrar</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Layout ── */
    .doc-page { padding: 28px; min-height: 100%; background: var(--bg-main, #f8fafc); }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
    }
    h1 { font-size: 28px; font-weight: 700; color: var(--text-primary, #0f172a); margin: 0 0 4px; }
    .subtitle { font-size: 13px; color: var(--text-secondary, #64748b); margin: 0; }

    .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* ── Search ── */
    .search-wrap {
      display: flex; align-items: center; gap: 8px;
      background: var(--card-bg, #fff); border: 1px solid var(--border-soft, #e2e8f0);
      border-radius: 8px; padding: 8px 12px; box-shadow: var(--shadow-soft);
    }
    .search-wrap i { color: #94a3b8; font-size: 13px; }
    .search-in { border: none; outline: none; color: var(--text-primary, #0f172a); font-size: 14px; width: 200px; background: transparent; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap;
    }
    .btn-primary { background: var(--primary, #4f46e5); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-strong, #4338ca); box-shadow: 0 4px 12px rgba(79,70,229,.3); }
    .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
    .btn-secondary { background: var(--card-bg, #fff); color: #475569; border: 1px solid var(--border-soft, #e2e8f0); }
    .btn-secondary:hover { background: #f1f5f9; }

    /* ── Crear dropdown ── */
    .crear-wrap { position: relative; }
    .chev { font-size: 11px; transition: transform .2s; }
    .chev-open { transform: rotate(180deg); }

    .tipos-dropdown {
      position: absolute; top: calc(100% + 6px); right: 0;
      background: var(--card-bg, #fff); border: 1px solid var(--border-soft, #e2e8f0);
      border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.12);
      width: 230px; z-index: 200; padding: 6px;
    }
    .drop-label {
      font-size: 10px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: .5px; margin: 6px 10px 6px; padding: 0;
    }
    .tipo-row {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 8px 10px; border: none; background: transparent;
      border-radius: 8px; cursor: pointer; transition: background .15s;
    }
    .tipo-row:hover:not(:disabled) { background: var(--primary-soft, #eef2ff); }
    .tipo-row:disabled { opacity: .5; cursor: wait; }
    .tipo-row i:first-child { font-size: 17px; width: 18px; text-align: center; flex-shrink: 0; }
    .tipo-nombre { flex: 1; text-align: left; font-size: 13px; font-weight: 600; color: var(--text-primary, #0f172a); }
    .tipo-ext { font-size: 11px; color: #94a3b8; }

    /* ── Alerts ── */
    .alerta { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
    .alerta-error  { background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; }
    .alerta-exito  { background: #d1fae5; border: 1px solid #a7f3d0; color: #059669; }
    .close-alerta  { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; display: flex; font-size: 14px; padding: 0; }

    /* ── Card ── */
    .card { background: var(--card-bg, #fff); border: 1px solid var(--border-soft, #e2e8f0); border-radius: 12px; box-shadow: var(--shadow-soft); overflow: hidden; }
    .card-head { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .card-title-row { display: flex; align-items: center; gap: 8px; }
    .card-title-row h2 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary, #0f172a); }
    .card-icon { color: var(--primary, #4f46e5); font-size: 15px; }
    .badge-cnt { background: var(--primary-soft, #eef2ff); color: var(--primary, #4f46e5); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }

    /* ── Table ── */
    .tabla-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      padding: 10px 16px; background: #f8fafc; color: #64748b;
      text-align: left; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .5px;
      border-bottom: 1px solid var(--border-soft, #e2e8f0);
    }
    tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #fafafa; }

    .td-nombre { display: flex; align-items: center; gap: 8px; }
    .td-nombre i { font-size: 15px; flex-shrink: 0; }
    .doc-nombre-txt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
    .badge-oficina { font-size: 10px; font-weight: 600; background: var(--primary-soft, #eef2ff); color: var(--primary, #4f46e5); padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
    .ext-badge { display: inline-block; padding: 2px 6px; background: #f1f5f9; border: 1px solid var(--border-soft, #e2e8f0); border-radius: 4px; font-size: 11px; color: #64748b; text-transform: uppercase; }
    .td-muted { color: #94a3b8; }
    .td-acc { display: flex; gap: 4px; }

    .btn-ic {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border: 1px solid var(--border-soft, #e2e8f0);
      border-radius: 6px; background: var(--card-bg, #fff); cursor: pointer;
      transition: all .15s; font-size: 12px;
    }
    .btn-ic-primary { color: var(--primary, #4f46e5); }
    .btn-ic-primary:hover { background: var(--primary-soft, #eef2ff); border-color: #c7d2fe; }
    .btn-ic-muted { color: #64748b; }
    .btn-ic-muted:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .btn-ic-edit { color: #0891b2; }
    .btn-ic-edit:hover { background: #e0f2fe; border-color: #bae6fd; }
    .btn-ic-danger { color: var(--danger, #ef4444); }
    .btn-ic-danger:hover { background: #fee2e2; border-color: #fecaca; }

    .sin-datos { text-align: center; padding: 48px 16px; color: #94a3b8; }
    .sin-datos i { font-size: 28px; display: block; margin-bottom: 8px; opacity: .5; }

    .loading-row { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px; color: #94a3b8; font-size: 14px; }

    /* ── Modals ── */
    .overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,.5);
      backdrop-filter: blur(3px); display: flex; align-items: center;
      justify-content: center; z-index: 999; padding: 16px;
    }
    .modal {
      background: var(--card-bg, #fff); border-radius: 14px; width: 100%;
      max-width: 460px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,.15);
    }
    .modal-lg { max-width: 680px; }
    .modal-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid var(--border-soft, #e2e8f0);
    }
    .modal-head h3 {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 700; color: var(--text-primary, #0f172a); margin: 0;
    }
    .close-btn {
      width: 28px; height: 28px; border-radius: 6px; background: #f8fafc;
      border: 1px solid var(--border-soft, #e2e8f0); color: #64748b;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 12px; transition: all .15s;
    }
    .close-btn:hover { background: #fee2e2; border-color: #fecaca; color: var(--danger, #ef4444); }
    .modal-body { padding: 20px 22px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid var(--border-soft, #e2e8f0); }

    /* ── Forms ── */
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .form-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }
    .form-input {
      padding: 9px 12px; border: 1.5px solid var(--border-soft, #e2e8f0);
      border-radius: 8px; color: var(--text-primary, #0f172a); font-size: 14px;
      background: var(--card-bg, #fff); transition: border-color .15s; width: 100%; box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: var(--primary, #4f46e5); box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
    .file-input { cursor: pointer; }
  `]
})
export class DocumentosComponent implements OnInit {
  documentos: DocumentoResponse[] = [];
  documentosFiltrados: DocumentoResponse[] = [];
  cargando = true;
  error: string | null = null;
  msgExito: string | null = null;
  filtroTexto = '';
  mostrarDropdown = false;

  mostrarSubir = false;
  archivoSeleccionado: File | null = null;
  nuevoNombre = '';
  subiendo = false;

  mostrarAuditoria = false;
  cargandoAuditoria = false;
  docAuditoriaActual: DocumentoResponse | null = null;
  auditoria: any[] = [];

  mostrarModalNombre = false;
  tipoSeleccionado: TipoDoc | null = null;
  nombreNuevoDoc = '';
  creandoTipo: string | null = null;

  private empresaId = '';

  readonly tiposDoc: TipoDoc[] = [
    { tipo: 'docx', faIcon: 'fa-file-word',       etiqueta: 'Word',       color: '#2b579a' },
    { tipo: 'xlsx', faIcon: 'fa-file-excel',       etiqueta: 'Excel',      color: '#217346' },
    { tipo: 'pptx', faIcon: 'fa-file-powerpoint',  etiqueta: 'PowerPoint', color: '#b7472a' },
    { tipo: 'odt',  faIcon: 'fa-file-alt',         etiqueta: 'OpenDoc',    color: '#64748b' },
    { tipo: 'csv',  faIcon: 'fa-file-csv',         etiqueta: 'CSV',        color: '#0891b2' },
    { tipo: 'txt',  faIcon: 'fa-file-alt',         etiqueta: 'Texto',      color: '#64748b' },
  ];

  constructor(
    private documentoService: DocumentoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.empresaId = user?.empresaId ?? 'general';
    this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.cargando = true;
    this.documentoService.listar(this.empresaId).subscribe({
      next: (docs) => {
        this.documentos = docs;
        this.documentosFiltrados = [...docs];
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar documentos'; this.cargando = false; }
    });
  }

  filtrar(): void {
    const f = this.filtroTexto.toLowerCase();
    if (!f) { this.documentosFiltrados = [...this.documentos]; return; }
    this.documentosFiltrados = this.documentos.filter(d =>
      d.nombre.toLowerCase().includes(f) || (d.descripcion ?? '').toLowerCase().includes(f)
    );
  }

  // ── Dropdown crear ────────────────────────────────────────────────────────

  toggleDropdown(): void { this.mostrarDropdown = !this.mostrarDropdown; }
  cerrarDropdown(): void { this.mostrarDropdown = false; }

  solicitarCrear(tipo: TipoDoc): void {
    this.tipoSeleccionado = tipo;
    this.nombreNuevoDoc = '';
    this.mostrarDropdown = false;
    this.mostrarModalNombre = true;
  }

  cancelarCrear(): void {
    this.mostrarModalNombre = false;
    this.tipoSeleccionado = null;
    this.nombreNuevoDoc = '';
  }

  confirmarCrear(): void {
    if (!this.nombreNuevoDoc.trim() || !this.tipoSeleccionado) return;
    const tipo = this.tipoSeleccionado;
    this.creandoTipo = tipo.tipo;
    this.mostrarModalNombre = false;
    this.documentoService.crearDocumentoOficina(this.nombreNuevoDoc.trim(), tipo.tipo).subscribe({
      next: (doc) => {
        this.creandoTipo = null;
        this.msgExito = `"${doc.nombre}" creado correctamente.`;
        setTimeout(() => this.msgExito = null, 4000);
        this.cargarDocumentos();
      },
      error: () => { this.creandoTipo = null; this.error = 'Error al crear el documento.'; }
    });
  }

  // ── Subir archivo ─────────────────────────────────────────────────────────

  abrirSubir(): void { this.mostrarSubir = true; }

  cerrarSubir(): void {
    this.mostrarSubir = false;
    this.archivoSeleccionado = null;
    this.nuevoNombre = '';
  }

  onFileSelected(event: any): void {
    this.archivoSeleccionado = event.target.files[0] ?? null;
    if (this.archivoSeleccionado && !this.nuevoNombre) {
      this.nuevoNombre = this.archivoSeleccionado.name;
    }
  }

  subirDocumento(): void {
    if (!this.archivoSeleccionado) return;
    this.subiendo = true;
    const datos = { empresaId: this.empresaId, nombre: this.nuevoNombre || this.archivoSeleccionado.name };
    this.documentoService.subir(this.archivoSeleccionado, datos).subscribe({
      next: () => {
        this.subiendo = false;
        this.cerrarSubir();
        this.msgExito = 'Documento subido correctamente.';
        setTimeout(() => this.msgExito = null, 3000);
        this.cargarDocumentos();
      },
      error: () => { this.error = 'Error al subir el documento'; this.subiendo = false; }
    });
  }

  // ── Editar con OnlyOffice ─────────────────────────────────────────────────

  editarDocumento(doc: DocumentoResponse): void {
    this.router.navigate(['/gestor/documentos/editor', doc.id]);
  }

  esEditable(doc: DocumentoResponse): boolean {
    const ext = (doc.tipoDocumento ?? this.getExtension(doc.nombre)).toLowerCase();
    return ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt', 'ods', 'odp'].includes(ext);
  }

  // ── Ver / eliminar / auditoría ────────────────────────────────────────────

  verDocumento(doc: DocumentoResponse): void {
    const key = doc.s3Key ?? this.extraerKey(doc.urlArchivo);
    this.documentoService.generarUrlPresignada(key, 60).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => window.open(doc.urlArchivo, '_blank')
    });
  }

  eliminarDocumento(doc: DocumentoResponse): void {
    if (!confirm(`¿Eliminar "${doc.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.documentoService.eliminarDocumento(doc.id).subscribe({
      next: () => {
        this.msgExito = 'Documento eliminado.';
        setTimeout(() => this.msgExito = null, 3000);
        this.cargarDocumentos();
      },
      error: () => { this.error = 'Error al eliminar el documento.'; }
    });
  }

  verAuditoria(doc: DocumentoResponse): void {
    this.docAuditoriaActual = doc;
    this.mostrarAuditoria = true;
    this.cargandoAuditoria = true;
    this.auditoria = [];
    this.documentoService.obtenerAuditoria(doc.id).subscribe({
      next: (a) => { this.auditoria = a; this.cargandoAuditoria = false; },
      error: () => { this.cargandoAuditoria = false; }
    });
  }

  cerrarAuditoria(): void { this.mostrarAuditoria = false; this.auditoria = []; }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getExtension(nombre: string): string {
    if (!nombre?.includes('.')) return '';
    return nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase();
  }

  getIconoTipo(mime?: string, tipo?: string): string {
    const ext = tipo?.toLowerCase();
    if (ext === 'docx' || ext === 'doc' || ext === 'odt') return 'fa-file-word';
    if (ext === 'xlsx' || ext === 'xls' || ext === 'ods') return 'fa-file-excel';
    if (ext === 'pptx' || ext === 'ppt' || ext === 'odp') return 'fa-file-powerpoint';
    if (ext === 'pdf') return 'fa-file-pdf';
    if (ext === 'csv') return 'fa-file-csv';
    if (!mime) return 'fa-file-alt';
    if (mime.includes('word') || mime.includes('odt'))             return 'fa-file-word';
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return 'fa-file-excel';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'fa-file-powerpoint';
    if (mime.includes('pdf'))   return 'fa-file-pdf';
    if (mime.includes('image')) return 'fa-file-image';
    return 'fa-file-alt';
  }

  getColorTipo(tipo?: string): string {
    const found = this.tiposDoc.find(t => t.tipo === tipo?.toLowerCase());
    if (found) return found.color;
    const extra: Record<string, string> = { pdf: '#dc2626', jpg: '#7c3aed', jpeg: '#7c3aed', png: '#7c3aed', gif: '#7c3aed' };
    return tipo ? (extra[tipo.toLowerCase()] ?? '#64748b') : '#64748b';
  }

  private extraerKey(url: string): string {
    try {
      const clean = url.includes('?') ? url.substring(0, url.indexOf('?')) : url;
      const parts = clean.split('.amazonaws.com/');
      return parts.length > 1 ? parts[1] : url;
    } catch { return url; }
  }
}
