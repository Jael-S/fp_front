import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol, User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

interface AuthResponse {
  token: string;
  id: string;
  rol: Rol;
  nombre: string;
  email: string;
  empresaId: string | null;
  departamentoId: string | null;
}

interface RegistroRequest {
  nombreEmpresa: string;
  nombreAdmin: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'fp_token';
  private readonly userKey = 'fp_user';
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly currentUserSignal = signal<User | null>(this.readPersistedUser());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal()?.token);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.authUrl}/login`, { email, password }).pipe(
      timeout(10000),
      tap((response) => this.saveSession(response.data)),
      map((response) => response.data),
    );
  }

  registro(payload: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.authUrl}/registro`, payload).pipe(
      tap((response) => this.saveSession(response.data)),
      map((response) => response.data),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    return this.currentUserSignal();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getRol(): string | null {
    return this.getUser()?.rol ?? null;
  }

  private saveSession(response: AuthResponse): void {
    const user: User = {
      id: response.id,
      nombre: response.nombre,
      email: response.email,
      rol: response.rol,
      token: response.token,
      empresaId: response.empresaId,
      departamentoId: response.departamentoId,
    };

    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private readPersistedUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(this.userKey);
      localStorage.removeItem(this.tokenKey);
      return null;
    }
  }
}

