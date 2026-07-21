/** Formato de listagem paginada devolvido por todo GET de coleção do backend. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Formato de erro estruturado do backend. `errors` só vem em 400 de validação de DTO. */
export interface ApiErrorBody {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  errors?: { field: string; message: string }[];
}
