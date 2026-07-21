export function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}
