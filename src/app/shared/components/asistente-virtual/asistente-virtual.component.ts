import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Mensaje {
  texto: string;
  esUsuario: boolean;
  hora: string;
}

@Component({
  selector: 'app-asistente-virtual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistente-virtual.component.html',
  styleUrl: './asistente-virtual.component.scss',
})
export class AsistenteVirtualComponent {
  chatAbierto = false;
  mensajes: Mensaje[] = [];
  input = '';

  readonly sugerencias = [
    '¿Cómo creo un usuario?',
    '¿Cómo creo una política?',
    '¿Cómo genero un diagrama con IA?',
    '¿Cómo creo un formulario?',
    '¿Cómo ejecuto una tarea?',
    '¿Qué roles hay?',
  ];

  private readonly base: { palabras: string[]; respuesta: string }[] = [
    {
      palabras: ['usuario'],
      respuesta:
        'Para crear un usuario ve a Sidebar → Usuarios → Nuevo. Completa nombre, email, contraseña, elige un rol (Gestor, Admin Área, Funcionario) y asigna un departamento.',
    },
    {
      palabras: ['departamento'],
      respuesta:
        'Ve a Sidebar → Departamentos → Nuevo. Ingresa nombre y descripción, luego asigna un Administrador de Área responsable.',
    },
    {
      palabras: ['formulario tarea', 'asignar formulario'],
      respuesta:
        'En el diagramador haz clic en una tarea (rectángulo azul). Se abrirá un modal donde puedes seleccionar el formulario del departamento correspondiente.',
    },
    {
      palabras: ['formulario'],
      respuesta:
        'Ve a Sidebar → Formularios → Nuevo. Selecciona un departamento y agrega campos (Texto, Número, Fecha, Selección, Archivo, Imagen). También puedes usar "Generar campos con IA".',
    },
    {
      palabras: ['diagrama ia', 'generar diagrama', 'diagrama con ia'],
      respuesta:
        'Crea una política nueva. Luego haz clic en "Generar con IA", describe el proceso por voz o escribiendo, y la IA creará el diagrama automáticamente.',
    },
    {
      palabras: ['politica'],
      respuesta:
        'Ve a Sidebar → Políticas → Nueva política. Completa nombre y descripción. Luego edita el diagrama arrastrando nodos desde la paleta.',
    },
    {
      palabras: ['tramite', 'iniciar tramite'],
      respuesta:
        'Ve a Sidebar → Trámites → Nuevo trámite. Selecciona una política ACTIVA, define título, prioridad y fecha límite, luego guarda.',
    },
    {
      palabras: ['ejecutar tarea', 'mis tareas', 'completar tarea', 'funcionario'],
      respuesta:
        'Inicia sesión como Funcionario. Ve a Sidebar → Mis Tareas. Selecciona la tarea, completa el formulario y haz clic en "Completar".',
    },
    {
      palabras: ['monitoreo', 'tiempo real', 'estado'],
      respuesta:
        'Ve a Sidebar → Monitoreo. Selecciona una política ACTIVA. Verás el diagrama con colores: 🟢 Verde (completado), 🟡 Amarillo (en proceso), 🔴 Rojo (pendiente).',
    },
    {
      palabras: ['cuello', 'botella', 'analisis ia', 'analisis'],
      respuesta:
        'Ve a Sidebar → Análisis IA. Selecciona una política con trámites completados. El sistema mostrará qué nodos tardan más y sugerencias de mejora.',
    },
    {
      palabras: ['voz', 'microfono', 'grabar', 'audio'],
      respuesta:
        'En la creación de políticas o formularios haz clic en "Grabar descripción" (micrófono). Habla describiendo el proceso y la IA generará el diagrama automáticamente.',
    },
    {
      palabras: ['rol', 'roles', 'permisos'],
      respuesta:
        'Hay tres roles: GESTOR_SISTEMA (control total), ADMINISTRADOR_AREA (gestiona su departamento), FUNCIONARIO (ejecuta tareas asignadas).',
    },
    {
      palabras: ['hola', 'buenos', 'buenas', 'hey'],
      respuesta:
        '¡Hola! Soy el asistente de FlowPolicy. Pregúntame sobre usuarios, políticas, formularios, trámites, monitoreo o la IA.',
    },
    {
      palabras: ['ayuda', 'help', 'que puedes', 'que haces', 'como funciona'],
      respuesta:
        'Puedo orientarte con: usuarios, departamentos, políticas, diagramas IA, formularios, trámites, monitoreo y análisis de cuellos de botella. ¿Qué necesitas?',
    },
  ];

  constructor() {
    this._bot(
      '¡Hola! Soy el asistente de FlowPolicy. ¿En qué puedo ayudarte? Pregúntame sobre usuarios, políticas, formularios, trámites o la IA.',
    );
  }

  toggle(): void {
    this.chatAbierto = !this.chatAbierto;
    if (this.chatAbierto) setTimeout(() => this._scroll(), 50);
  }

  enviar(): void {
    const texto = this.input.trim();
    if (!texto) return;
    this.mensajes.push({ texto, esUsuario: true, hora: this._hora() });
    this.input = '';
    setTimeout(() => {
      this._bot(this._responder(texto));
      this._scroll();
    }, 180);
  }

  sugerir(p: string): void {
    this.input = p;
    this.enviar();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const t = e.target as HTMLElement;
    if (this.chatAbierto && !t.closest('.av-wrap') && !t.closest('.av-fab')) {
      this.chatAbierto = false;
    }
  }

  private _normalizar(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[¿?¡!,]/g, '');
  }

  private _responder(texto: string): string {
    const n = this._normalizar(texto);
    for (const entry of this.base) {
      if (entry.palabras.some((p) => n.includes(this._normalizar(p)))) {
        return entry.respuesta;
      }
    }
    return 'No encontré una respuesta. Prueba palabras como: usuario, política, formulario, trámite, diagrama, monitoreo, roles.';
  }

  private _bot(texto: string): void {
    this.mensajes.push({ texto, esUsuario: false, hora: this._hora() });
  }

  private _hora(): string {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private _scroll(): void {
    const el = document.querySelector('.av-body');
    if (el) el.scrollTop = el.scrollHeight;
  }
}
