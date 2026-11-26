import type { AdminApi, AmbientizaApi } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const CHAVE_TOKEN = 'ambientiza:token';
export const EVENTO_SESSAO_EXPIRADA = 'ambientiza:sessao-expirada';

export const tokenStorage = {
  obter: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (token: string) => localStorage.setItem(CHAVE_TOKEN, token),
  limpar: () => localStorage.removeItem(CHAVE_TOKEN),
};

async function http<T>(caminho: string, init?: RequestInit): Promise<T> {
  const token = tokenStorage.obter();
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
  }

  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status} ao acessar o servidor.`;
    try {
      const corpo = await resposta.json();
      if (typeof corpo?.message === 'string') mensagem = corpo.message;
    } catch {
      // corpo vazio ou não-JSON: mantém a mensagem padrão
    }
    if (resposta.status === 401 && token) {
      tokenStorage.limpar();
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new Error(mensagem);
  }

  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

const enviar = <T>(metodo: 'POST' | 'PUT' | 'DELETE', caminho: string, corpo?: unknown) =>
  http<T>(caminho, { method: metodo, body: corpo === undefined ? undefined : JSON.stringify(corpo) });

export const api: AmbientizaApi = {
  login: (dados) => enviar('POST', '/auth/login', dados),
  cadastrar: (dados) => enviar('POST', '/auth/cadastro', dados),
  logout: () => enviar('POST', '/auth/logout'),
  buscarUsuario: () => http('/usuario/me'),
  buscarEstatisticas: () => http('/usuario/me/estatisticas'),
  listarResgates: () => http('/usuario/me/resgates'),
  listarTarefasDoDia: () => http('/tarefas/hoje'),
  concluirTarefa: (idTarefa) => enviar('POST', `/tarefas/${idTarefa}/concluir`),
  listarQuizzes: () => http('/quiz'),
  buscarQuiz: (idQuiz) => http(`/quiz/${idQuiz}`),
  responderPergunta: (idPergunta, idAlternativa) => enviar('POST', '/quiz/respostas', { idPergunta, idAlternativa }),
  finalizarQuiz: (idQuiz) => enviar('POST', `/quiz/${idQuiz}/finalizar`),
  listarRecompensas: () => http('/recompensas'),
  resgatar: (idRecompensa) => enviar('POST', `/recompensas/${idRecompensa}/resgatar`),
};

export const adminApi: AdminApi = {
  listarUsuarios: () => http('/admin/usuarios'),
  alterarPapel: (id, papel) => enviar('PUT', `/admin/usuarios/${id}/papel`, { papel }),
  listarRecompensas: () => http('/admin/recompensas'),
  salvarRecompensa: (id, dados) =>
    id === null ? enviar('POST', '/admin/recompensas', dados) : enviar('PUT', `/admin/recompensas/${id}`, dados),
  removerRecompensa: (id) => enviar('DELETE', `/admin/recompensas/${id}`),
  listarTarefas: () => http('/admin/tarefas'),
  salvarTarefa: (id, dados) =>
    id === null ? enviar('POST', '/admin/tarefas', dados) : enviar('PUT', `/admin/tarefas/${id}`, dados),
  removerTarefa: (id) => enviar('DELETE', `/admin/tarefas/${id}`),
  listarQuizzes: () => http('/admin/quizzes'),
  criarQuiz: (dados) => enviar('POST', '/admin/quizzes', dados),
  removerQuiz: (id) => enviar('DELETE', `/admin/quizzes/${id}`),
};
