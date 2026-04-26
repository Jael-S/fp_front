export interface Empresa {
  id: string;
  nombre: string;
  descripcion?: string;
  email: string;
  telefono?: string;
  activo: boolean;
}

export interface EmpresaRequest {
  nombre: string;
  descripcion?: string;
  email: string;
  telefono?: string;
}
