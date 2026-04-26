export interface Departamento {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion?: string | null;
  responsableId: string;
  cantidadUsuarios: number;
  activo: boolean;
}

export interface DepartamentoRequest {
  nombre: string;
  descripcion?: string | null;
  responsableId: string;
}
