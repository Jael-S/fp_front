import { Rol } from './user.model';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  empresaId: string;
  departamentoId: string | null;
  activo: boolean;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  departamentoId: string | null;
}

export interface UsuarioUpdateRequest {
  nombre: string;
  email: string;
  rol: Rol;
  departamentoId: string | null;
  activo?: boolean;
}
