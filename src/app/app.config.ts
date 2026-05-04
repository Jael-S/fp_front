import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Servicios que deben ser provistos explícitamente en producción
import { DiagramaBpmnService } from './core/services/diagrama-bpmn.service';
import { PoliticaService } from './core/services/politica.service';
import { DepartamentoService } from './core/services/departamento.service';
import { FormularioService } from './core/services/formulario.service';
import { TareaService } from './core/services/tarea.service';
import { AuthService } from './core/services/auth.service';
import { UsuarioService } from './core/services/usuario.service';
import { EjecucionService } from './core/services/ejecucion.service';
import { TramiteService } from './core/services/tramite.service';
import { MonitoreoService } from './core/services/monitoreo.service';
import { NotificacionService } from './core/services/notificacion.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    
    DiagramaBpmnService,
    PoliticaService,
    DepartamentoService,
    FormularioService,
    TareaService,
    AuthService,
    UsuarioService,
    EjecucionService,
    TramiteService,
    MonitoreoService,
    NotificacionService,
  ],
};
