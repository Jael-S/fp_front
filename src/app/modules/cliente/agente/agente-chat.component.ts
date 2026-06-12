import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgenteService, RespuestaAgente } from '../../../core/services/agente.service';
import { AuthService } from '../../../core/services/auth.service';

interface MensajeUI {
  rol: 'cliente' | 'agente';
  contenido: string;
  tipo: string;
  timestamp: Date;
  cargando?: boolean;
}

@Component({
  selector: 'app-agente-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">

      <!-- Input de archivo oculto — compartido por todos los botones de carga -->
      <input #fileInput type="file" accept="*/*" capture="environment" class="file-input-hidden"
             (change)="onFileSelected($event)">

      <!-- Cabecera -->
      <div class="chat-header">
        <div class="agent-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="agent-info">
          <span class="agent-name">Asistente Virtual</span>
          <span class="agent-status">
            <span class="dot"></span> En línea
          </span>
        </div>
        <div class="header-actions">
          <button class="btn-icon" (click)="nuevaConversacion()" title="Nueva conversación">
            <i class="fas fa-plus-circle"></i>
          </button>
        </div>
      </div>

      <!-- Banner trámite activo -->
      <div class="tramite-banner" *ngIf="tramiteActivo">
        <i class="fas fa-file-alt"></i>
        <span>Trámite iniciado · Código: <strong>{{ codigoSeguimiento || tramiteActivo }}</strong></span>
        <button class="btn-ver-estado" (click)="verEstadoTramite()">Ver estado</button>
      </div>

      <!-- Mensajes -->
      <div class="chat-body" #chatBody>

        <div class="msg-row agente" *ngIf="cargandoHistorial">
          <div class="msg-bubble agente">
            <i class="fas fa-spinner fa-spin"></i> Cargando...
          </div>
        </div>

        <ng-container *ngFor="let msg of mensajes; let last = last">
          <div class="msg-row"
               [class.cliente]="msg.rol === 'cliente'"
               [class.agente]="msg.rol === 'agente'">

            <div class="msg-avatar" *ngIf="msg.rol === 'agente'">
              <i class="fas fa-robot"></i>
            </div>

            <div class="msg-bubble"
                 [class.cliente]="msg.rol === 'cliente'"
                 [class.agente]="msg.rol === 'agente'"
                 [class.confirmacion]="msg.tipo === 'confirmacion'"
                 [class.documento]="msg.tipo === 'documento'"
                 [class.error]="msg.tipo === 'error'">

              <span *ngIf="!msg.cargando" [innerHTML]="formatearMensaje(msg.contenido)"></span>
              <span *ngIf="msg.cargando" class="typing">
                <span></span><span></span><span></span>
              </span>

              <!-- ── Botón de carga dentro del bubble ── -->
              <div class="upload-in-bubble"
                   *ngIf="esperandoDocumento && last && msg.rol === 'agente' && !msg.cargando">
                <button class="btn-upload-bubble"
                        (click)="fileInput.click()"
                        [disabled]="subiendoDoc">
                  <i class="fas"
                     [class.fa-paperclip]="!subiendoDoc"
                     [class.fa-spinner]="subiendoDoc"
                     [class.fa-spin]="subiendoDoc"></i>
                  {{ subiendoDoc ? 'Subiendo...' : 'Seleccionar archivo' }}
                </button>
                <span class="file-selected-name" *ngIf="archivoSeleccionado">
                  <i class="fas fa-check-circle"></i> {{ archivoSeleccionado.name }}
                </span>
              </div>

            </div>

            <div class="msg-avatar cliente-avatar" *ngIf="msg.rol === 'cliente'">
              <i class="fas fa-user"></i>
            </div>

          </div>
        </ng-container>

        <!-- Modal estado trámite -->
        <div class="estado-modal" *ngIf="estadoTramiteVisible && estadoTramite">
          <div class="estado-card">
            <button class="close-btn" (click)="estadoTramiteVisible = false">
              <i class="fas fa-times"></i>
            </button>
            <div class="estado-icon" [class]="'estado-' + estadoTramite.estado.toLowerCase()">
              <i class="fas"
                 [class.fa-clock]="estadoTramite.estado === 'PENDIENTE'"
                 [class.fa-spinner]="estadoTramite.estado === 'EN_PROCESO'"
                 [class.fa-check-circle]="estadoTramite.estado === 'COMPLETADO'"
                 [class.fa-times-circle]="estadoTramite.estado === 'RECHAZADO'"></i>
            </div>
            <h3>{{ estadoTramite.politicaNombre }}</h3>
            <p class="estado-label">{{ estadoTramite.estado }}</p>
            <p class="estado-msg">{{ estadoTramite.mensaje }}</p>
            <p class="codigo-seg" *ngIf="estadoTramite.codigoSeguimiento">
              Código: <strong>{{ estadoTramite.codigoSeguimiento }}</strong>
            </p>
          </div>
        </div>

      </div>

      <!-- Input area — solo micrófono, texto y enviar -->
      <div class="chat-input-area">
        <div class="input-row">
          <button class="btn-mic"
                  [class.grabando]="grabando"
                  (click)="toggleVoz()"
                  [title]="grabando ? 'Detener grabación' : 'Hablar'"
                  [disabled]="enviando">
            <i class="fas"
               [class.fa-microphone]="!grabando"
               [class.fa-stop]="grabando"></i>
          </button>

          <textarea
            #inputArea
            class="input-text"
            [(ngModel)]="mensajeActual"
            (keydown.enter)="onEnter($event)"
            [placeholder]="esperandoDocumento
              ? 'Usa el botón de arriba para subir el documento...'
              : 'Escribe o usa el micrófono...'"
            [disabled]="enviando || esperandoDocumento"
            rows="1"
          ></textarea>

          <button class="btn-send"
                  (click)="enviarMensaje()"
                  [disabled]="!mensajeActual.trim() || enviando || esperandoDocumento">
            <i class="fas"
               [class.fa-paper-plane]="!enviando"
               [class.fa-spinner]="enviando"
               [class.fa-spin]="enviando"></i>
          </button>
        </div>

        <div class="voz-indicator" *ngIf="grabando">
          <span class="pulse"></span> Escuchando...
        </div>
        <div class="voz-error" *ngIf="vozError">{{ vozError }}</div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      position: relative;
      z-index: 1;
    }

    /* ── Página ── */
    .chat-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-main, #f8fafc);
      min-height: 0;
      position: relative;
    }

    /* Input oculto */
    .file-input-hidden { display: none; }

    /* ── Cabecera ── */
    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: var(--card-bg, #fff);
      border-bottom: 1px solid var(--border-soft, #e2e8f0);
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
      flex-shrink: 0;
    }
    .agent-avatar {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, var(--primary, #4f46e5), #7c3aed);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 18px; flex-shrink: 0;
    }
    .agent-info { flex: 1; }
    .agent-name { display: block; font-weight: 700; font-size: 15px; color: var(--text-primary, #0f172a); }
    .agent-status { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #22c55e; }
    .dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; }
    .header-actions { display: flex; gap: 8px; }
    .btn-icon {
      width: 36px; height: 36px;
      border: none;
      background: var(--primary-soft, #eef2ff);
      color: var(--primary, #4f46e5);
      border-radius: 8px; cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: all .15s;
    }
    .btn-icon:hover { background: var(--primary, #4f46e5); color: #fff; }

    /* ── Banner trámite ── */
    .tramite-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 20px;
      background: #d1fae5; color: #065f46;
      font-size: 13px; font-weight: 500; flex-shrink: 0;
    }
    .btn-ver-estado {
      margin-left: auto;
      padding: 4px 12px;
      background: #059669; color: #fff;
      border: none; border-radius: 6px;
      font-size: 12px; cursor: pointer; font-weight: 600;
    }

    /* ── Cuerpo mensajes ── */
    .chat-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      scroll-behavior: smooth;
      position: relative;
    }

    .msg-row { display: flex; align-items: flex-end; gap: 8px; }
    .msg-row.cliente { justify-content: flex-end; }
    .msg-row.agente  { justify-content: flex-start; }

    .msg-avatar {
      width: 30px; height: 30px;
      background: linear-gradient(135deg, var(--primary, #4f46e5), #7c3aed);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 13px; flex-shrink: 0;
    }
    .msg-avatar.cliente-avatar { background: #cbd5e1; color: #475569; }

    .msg-bubble {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px; line-height: 1.5;
      white-space: pre-wrap; word-break: break-word;
    }
    .msg-bubble.agente {
      background: var(--card-bg, #fff);
      color: var(--text-primary, #0f172a);
      border: 1px solid var(--border-soft, #e2e8f0);
      border-bottom-left-radius: 4px;
    }
    .msg-bubble.cliente {
      background: var(--primary, #4f46e5);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .msg-bubble.confirmacion { background: #fffbeb; border-color: #fbbf24; color: #78350f; }
    .msg-bubble.documento    { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
    .msg-bubble.error        { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }

    /* ── Botón de carga dentro del bubble ── */
    .upload-in-bubble {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    .btn-upload-bubble {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: background .15s, transform .1s;
      box-shadow: 0 2px 6px rgba(37,99,235,.3);
    }
    .btn-upload-bubble:hover:not(:disabled) {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .btn-upload-bubble:active:not(:disabled) { transform: translateY(0); }
    .btn-upload-bubble:disabled { opacity: .6; cursor: not-allowed; transform: none; }
    .file-selected-name {
      font-size: 12px;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .file-selected-name i { color: #16a34a; }

    /* ── Typing dots ── */
    .typing { display: inline-flex; gap: 4px; align-items: center; }
    .typing span {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #94a3b8;
      animation: bounce 1.2s infinite;
    }
    .typing span:nth-child(2) { animation-delay: .2s; }
    .typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30%           { transform: translateY(-6px); }
    }

    /* ── Modal estado ── */
    .estado-modal {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 500;
    }
    .estado-card {
      background: #fff; border-radius: 16px;
      padding: 32px 28px; max-width: 360px; width: 90%;
      text-align: center; position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }
    .close-btn {
      position: absolute; top: 14px; right: 14px;
      background: none; border: none;
      font-size: 18px; color: #94a3b8; cursor: pointer;
    }
    .estado-icon {
      width: 64px; height: 64px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; margin: 0 auto 16px;
    }
    .estado-icon.estado-pendiente  { background: #fef3c7; color: #d97706; }
    .estado-icon.estado-en_proceso { background: #dbeafe; color: #1d4ed8; }
    .estado-icon.estado-completado { background: #d1fae5; color: #059669; }
    .estado-icon.estado-rechazado  { background: #fee2e2; color: #dc2626; }
    .estado-card h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
    .estado-label   { font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 10px; }
    .estado-msg     { font-size: 14px; color: #475569; margin: 0 0 12px; }
    .codigo-seg     { font-size: 13px; color: #64748b; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; }

    /* ── Input area ── */
    .chat-input-area {
      padding: 12px 16px;
      background: var(--card-bg, #fff);
      border-top: 1px solid var(--border-soft, #e2e8f0);
      flex-shrink: 0;
    }
    .input-row {
      display: flex; align-items: flex-end; gap: 8px;
      background: #f1f5f9; border-radius: 12px;
      padding: 6px 6px 6px 10px;
      border: 1.5px solid transparent;
      transition: border-color .2s;
    }
    .input-row:focus-within { border-color: var(--primary, #4f46e5); background: #fff; }
    .input-text {
      flex: 1;
      border: none; background: transparent;
      font-size: 14px; color: var(--text-primary, #0f172a);
      resize: none; outline: none;
      min-height: 24px; max-height: 120px;
      padding: 4px 0; line-height: 1.5;
      font-family: inherit;
    }
    .input-text:disabled { opacity: .5; cursor: not-allowed; }
    .btn-mic, .btn-send {
      width: 38px; height: 38px;
      border: none; border-radius: 8px;
      cursor: pointer; font-size: 15px;
      display: flex; align-items: center; justify-content: center;
      transition: all .15s; flex-shrink: 0;
    }
    .btn-mic { background: var(--primary-soft, #eef2ff); color: var(--primary, #4f46e5); }
    .btn-mic.grabando { background: #fee2e2; color: #dc2626; animation: pulse-red 1s infinite; }
    .btn-mic:disabled { opacity: .5; cursor: not-allowed; }
    .btn-send { background: var(--primary, #4f46e5); color: #fff; }
    .btn-send:hover:not(:disabled) { background: #4338ca; }
    .btn-send:disabled { opacity: .45; cursor: not-allowed; }

    @keyframes pulse-red {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,.4); }
      50%       { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
    }
    .voz-indicator {
      margin-top: 6px; font-size: 12px; color: #dc2626;
      display: flex; align-items: center; gap: 6px;
    }
    .pulse {
      display: inline-block; width: 8px; height: 8px;
      border-radius: 50%; background: #dc2626;
      animation: pulse-red 1s infinite;
    }
    .voz-error { margin-top: 4px; font-size: 12px; color: #dc2626; }
  `]
})
export class AgenteChatComponent implements OnInit, OnDestroy {

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;
  @ViewChild('inputArea') inputArea!: ElementRef<HTMLTextAreaElement>;

  private readonly agenteService = inject(AgenteService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  mensajes: MensajeUI[] = [];
  mensajeActual = '';
  enviando = false;
  grabando = false;
  vozError = '';
  cargandoHistorial = true;
  subiendoDoc = false;
  archivoSeleccionado: File | null = null;

  conversacionId?: string;
  tramiteActivo?: string;
  codigoSeguimiento?: string;
  estadoTramiteVisible = false;
  estadoTramite: any = null;
  esperandoDocumento = false;
  requisitoActual = '';

  private recognition: any;

  ngOnInit(): void {
    this.restaurarConversacion();
    this.inicializarVoz();
  }

  private restaurarConversacion(): void {
    this.cargandoHistorial = true;
    this.agenteService.obtenerConversacionActiva().subscribe({
      next: (data) => {
        this.cargandoHistorial = false;
        if (data.tieneConversacionActiva && data.mensajes && data.mensajes.length > 0) {
          this.conversacionId = data.conversacionId;
          this.tramiteActivo = data.tramiteId || undefined;
          this.mensajes = data.mensajes.map(m => ({
            rol: m.rol,
            contenido: m.contenido,
            tipo: m.tipo,
            timestamp: new Date(m.timestamp)
          }));
          const estadoConv = data.estadoConversacion;
          if (estadoConv === 'ESPERANDO_ARCHIVOS' || estadoConv === 'RECOPILANDO_REQUISITOS') {
            this.esperandoDocumento = true;
            this.requisitoActual = (data as any).campoActual || '';
          }
        } else {
          this.mensajesBienvenida();
        }
        this.scrollAbajo();
      },
      error: () => {
        this.cargandoHistorial = false;
        this.mensajesBienvenida();
      }
    });
  }

  private mensajesBienvenida(): void {
    const nombre = this.authService.getUser()?.nombre?.split(' ')[0] ?? 'Cliente';
    this.agregarMensajeUI('agente',
      `¡Hola ${nombre}! Soy el asistente virtual.\n\n` +
      `Puedo ayudarte a iniciar trámites de forma rápida.\n` +
      `Escríbeme o usa el micrófono. ¿Qué necesitas?`,
      'texto'
    );
  }

  enviarMensaje(): void {
    const texto = this.mensajeActual.trim();
    if (!texto || this.enviando) return;

    this.mensajeActual = '';
    this.agregarMensajeUI('cliente', texto, 'texto');

    const cargandoIdx = this.mensajes.length;
    this.agregarMensajeUI('agente', '', 'texto', true);
    this.enviando = true;

    this.agenteService.enviarMensaje(texto, this.conversacionId).subscribe({
      next: (respuesta) => this.procesarRespuesta(respuesta, cargandoIdx),
      error: () => {
        this.mensajes.splice(cargandoIdx, 1);
        this.agregarMensajeUI('agente', 'Lo siento, ocurrió un error de conexión. Por favor intenta de nuevo.', 'error');
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.conversacionId) return;

    this.archivoSeleccionado = file;
    this.subiendoDoc = true;
    this.agregarMensajeUI('cliente', `📎 ${file.name}`, 'texto');

    const cargandoIdx = this.mensajes.length;
    this.agregarMensajeUI('agente', '', 'texto', true);

    this.agenteService.subirDocumento(file, this.conversacionId).subscribe({
      next: (respuesta) => {
        this.subiendoDoc = false;
        this.archivoSeleccionado = null;
        input.value = '';
        this.procesarRespuesta(respuesta, cargandoIdx);
      },
      error: () => {
        this.subiendoDoc = false;
        this.mensajes.splice(cargandoIdx, 1);
        this.agregarMensajeUI('agente', 'No se pudo subir el archivo. Intenta de nuevo.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private procesarRespuesta(respuesta: RespuestaAgente, cargandoIdx: number): void {
    this.mensajes.splice(cargandoIdx, 1);
    this.conversacionId = respuesta.conversacionId;

    if (respuesta.tramiteId) {
      this.tramiteActivo = respuesta.tramiteId;
      this.codigoSeguimiento = respuesta.codigoSeguimiento;
    }

    const estado = respuesta.estado ?? '';
    const esperaArchivo = (respuesta as any).esperandoArchivo === true;
    this.esperandoDocumento =
      estado === 'ESPERANDO_ARCHIVOS' ||
      estado === 'RECOPILANDO_REQUISITOS' ||
      esperaArchivo;

    if ((respuesta as any).campoActual) {
      this.requisitoActual = (respuesta as any).campoActual;
    }
    if (['ESPERANDO_APROBACION', 'COMPLETADO', 'TRAMITE_EN_PROCESO', 'RECHAZADO'].includes(estado)) {
      this.esperandoDocumento = false;
    }

    this.agregarMensajeUI(
      'agente',
      respuesta.mensajeAgente,
      this.tipoMensaje(estado, respuesta)
    );
    this.enviando = false;
    this.scrollAbajo();
    this.cdr.detectChanges();
  }

  verEstadoTramite(): void {
    if (!this.tramiteActivo) return;
    this.agenteService.obtenerEstadoTramite(this.tramiteActivo).subscribe({
      next: (res) => {
        this.estadoTramite = res.data;
        this.estadoTramiteVisible = true;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  nuevaConversacion(): void {
    this.conversacionId = undefined;
    this.tramiteActivo = undefined;
    this.codigoSeguimiento = undefined;
    this.esperandoDocumento = false;
    this.requisitoActual = '';
    this.archivoSeleccionado = null;
    this.mensajes = [];
    this.mensajesBienvenida();
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.enviarMensaje();
    }
  }

  // ─── Voz ─────────────────────────────────────────────────────────────────

  private inicializarVoz(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const transcripcion = event.results[0][0].transcript;
      this.mensajeActual = transcripcion;
      this.grabando = false;
      this.vozError = '';
      this.cdr.detectChanges();
      setTimeout(() => this.enviarMensaje(), 300);
    };

    this.recognition.onerror = (event: any) => {
      this.grabando = false;
      if (event.error !== 'no-speech') {
        this.vozError = 'No se pudo capturar el audio. Intenta de nuevo.';
      }
      this.cdr.detectChanges();
    };

    this.recognition.onend = () => {
      this.grabando = false;
      this.cdr.detectChanges();
    };
  }

  toggleVoz(): void {
    if (!this.recognition) {
      this.vozError = 'Tu navegador no soporta el reconocimiento de voz. Usa Chrome o Edge.';
      return;
    }
    this.vozError = '';
    if (this.grabando) {
      this.recognition.stop();
      this.grabando = false;
    } else {
      try {
        this.recognition.start();
        this.grabando = true;
      } catch {
        this.vozError = 'No se pudo iniciar el micrófono.';
      }
    }
    this.cdr.detectChanges();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private agregarMensajeUI(rol: 'cliente' | 'agente', contenido: string, tipo: string, cargando = false): void {
    this.mensajes.push({ rol, contenido, tipo, timestamp: new Date(), cargando });
    setTimeout(() => this.scrollAbajo(), 50);
  }

  private scrollAbajo(): void {
    if (this.chatBody?.nativeElement) {
      this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
    }
  }

  private tipoMensaje(estado: string, respuesta: RespuestaAgente): string {
    if (
      estado === 'ESPERANDO_ARCHIVOS' ||
      estado === 'RECOPILANDO_REQUISITOS' ||
      (respuesta as any).esperandoArchivo
    ) return 'documento';
    if (estado === 'CONFIRMANDO_POLITICA') return 'confirmacion';
    if (['ERROR', 'RECHAZADO'].includes(estado)) return 'error';
    return 'texto';
  }

  formatearMensaje(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  ngOnDestroy(): void {
    if (this.recognition && this.grabando) {
      this.recognition.stop();
    }
  }
}
