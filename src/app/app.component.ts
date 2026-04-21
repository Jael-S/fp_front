import { Component } from '@angular/core';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <h1 style="color:#1A87C0; text-align:center; margin-top:50px">��� FlowPolicy</h1>
    <div style="text-align:center; margin-top:20px">
      <button (click)="probarBackend()" style="padding:10px 20px; background:#1A87C0; color:white; border:none; border-radius:5px; cursor:pointer">
        Probar conexión con backend
      </button>
      <p>{{ mensaje }}</p>
    </div>
  `
})
export class AppComponent {
  mensaje = '';

  constructor(private http: HttpClient) {}

  probarBackend() {
    this.http.get('http://localhost:8080/actuator/health').subscribe({
      next: () => this.mensaje = '✅ Conectado al backend exitosamente',
      error: () => this.mensaje = '❌ Error: Backend no disponible'
    });
  }
}
