import type { NivelDificuldade } from './types';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function paraIso(data: Date): string {
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${d}`;
}

export function paraData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function hoje(): string {
  return paraIso(new Date());
}

export function ontem(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return paraIso(d);
}

export function mesAno(iso: string): string {
  const d = paraData(iso);
  return `${MESES[d.getMonth()]}/${d.getFullYear()}`;
}

export function formatarPontos(valor: number): string {
  return valor.toLocaleString('pt-BR');
}

// Pontos por acerto conforme a dificuldade (espelha NivelDificuldade no backend).
export const PONTOS_POR_DIFICULDADE: Record<NivelDificuldade, number> = { FACIL: 10, MEDIO: 30, DIFICIL: 50 };
export const ROTULO_DIFICULDADE: Record<NivelDificuldade, string> = { FACIL: 'Fácil', MEDIO: 'Média', DIFICIL: 'Difícil' };

// Quizzes de dias anteriores ficam disponíveis por esse número de dias (espelha QuizService.DIAS_TOLERANCIA).
export const DIAS_TOLERANCIA_QUIZ = 7;

export function diasParaExpirar(dataDisponivel: string): number {
  const limite = paraData(dataDisponivel);
  limite.setDate(limite.getDate() + DIAS_TOLERANCIA_QUIZ);
  return Math.round((limite.getTime() - paraData(hoje()).getTime()) / 86_400_000);
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function mensagemErro(e: unknown): string {
  return e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.';
}

export function semanaOfensiva(ultimaAtividade: string | null, ofensiva: number) {
  const ref = paraData(hoje());
  const domingo = new Date(ref);
  domingo.setDate(ref.getDate() - ref.getDay());
  const fim = paraData(ultimaAtividade ?? hoje());
  const inicio = new Date(fim);
  inicio.setDate(fim.getDate() - ofensiva + 1);

  return ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((letra, i) => {
    const dia = new Date(domingo);
    dia.setDate(domingo.getDate() + i);
    return { letra, ativo: ofensiva > 0 && dia >= inicio && dia <= fim, hoje: paraIso(dia) === hoje() };
  });
}
