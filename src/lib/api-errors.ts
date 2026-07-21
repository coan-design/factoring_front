import { isAxiosError } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiErrorBody } from '../types/common';

/**
 * Único ponto de tradução de erro 400 de validação do backend
 * ({ errors: [{ field, message }] }) para os campos do React Hook Form.
 * Retorna a mensagem genérica para exibir quando não há erros de campo
 * (ex: 401, 403, 409, 500).
 */
export function mapApiErrorsToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (isAxiosError<ApiErrorBody>(error) && error.response?.data) {
    const body = error.response.data;
    if (body.errors?.length) {
      for (const { field, message } of body.errors) {
        setError(field as Path<T>, { type: 'server', message });
      }
    }
    return body.message ?? 'Não foi possível concluir a operação.';
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}
