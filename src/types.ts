// Espelha os enums, models e DTOs de ambientiza-backend (com.ambientiza.api).

export type Tipo = 'DIARIO' | 'SEMANAL';
export type Status = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
export type Temas = 'GESTAO_RECICLAGEM' | 'CONSUMO_CONSCIENTE' | 'PRESERVACAO_BIODIVERSIDADE_LOCAL';
export type NivelDificuldade = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type Papel = 'USUARIO' | 'ADMIN';

export interface Usuario {
  idUsuario: number;
  nome: string;
  email: string;
  saldo: number;
  ofensivaAtual: number;
  ultimaAtividade: string | null;
  criadoEm: string;
  papel: Papel;
}

export interface Tarefa {
  idTarefa: number;
  titulo: string;
  descricao: string;
  pontosRecompensa: number;
  tipo: Tipo;
}

export interface TarefaDoDia extends Tarefa {
  concluida: boolean;
}

export interface Quiz {
  idQuiz: number;
  titulo: string;
  tema: Temas;
  dataDisponivel: string;
  totalPerguntas: number;
}

export interface QuizAlternativa {
  idQuizAlternativas: number;
  texto: string;
}

export interface QuizPergunta {
  idPergunta: number;
  enunciado: string;
  nivelDificuldade: NivelDificuldade;
  pontos: number;
  alternativas: QuizAlternativa[];
}

export interface QuizTentativaDiaria {
  idQuizTentativaDiaria: number;
  idQuiz: number;
  dataJogada: string;
  acerto: number;
  pontosGanhos: number;
}

export interface QuizDoDia {
  quiz: Quiz;
  perguntas: QuizPergunta[];
  respondidas: number[];
  tentativa: QuizTentativaDiaria | null;
  /** Quiz de um dia anterior (até 7 dias atrás): rende metade dos pontos. */
  valeMetade: boolean;
}

export interface QuizDisponivel {
  quiz: Quiz;
  respondidas: number;
  tentativa: QuizTentativaDiaria | null;
  valeMetade: boolean;
}

export interface ResultadoResposta {
  correta: boolean;
  idAlternativaCorreta: number;
}

export interface Recompensa {
  idRecompensa: number;
  nome: string;
  descricao: string;
  custo: number;
  estoque: number;
}

export interface ResgateRecompensa {
  idResgate: number;
  idRecompensa: number;
  nomeRecompensa: string;
  pontosGastos: number;
  dataResgate: string;
}

export interface Estatisticas {
  tarefasFeitas: number;
  quizzesFeitos: number;
}

export interface LoginUsuario {
  email: string;
  senha: string;
}

export interface Cadastro {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export type RecompensaRequest = Omit<Recompensa, 'idRecompensa'>;
export type TarefaRequest = Omit<Tarefa, 'idTarefa'>;

export interface QuizRequest {
  titulo: string;
  tema: Temas;
  dataDisponivel: string;
  perguntas: {
    enunciado: string;
    nivelDificuldade: NivelDificuldade;
    alternativas: { texto: string; correta: boolean }[];
  }[];
}

export interface AmbientizaApi {
  login(dados: LoginUsuario): Promise<LoginResponse>;
  cadastrar(dados: Cadastro): Promise<LoginResponse>;
  logout(): Promise<void>;
  buscarUsuario(): Promise<Usuario>;
  buscarEstatisticas(): Promise<Estatisticas>;
  listarTarefasDoDia(): Promise<TarefaDoDia[]>;
  concluirTarefa(idTarefa: number): Promise<Usuario>;
  listarQuizzes(): Promise<QuizDisponivel[]>;
  buscarQuiz(idQuiz: number): Promise<QuizDoDia>;
  responderPergunta(idPergunta: number, idAlternativa: number): Promise<ResultadoResposta>;
  finalizarQuiz(idQuiz: number): Promise<{ tentativa: QuizTentativaDiaria; usuario: Usuario }>;
  listarRecompensas(): Promise<Recompensa[]>;
  resgatar(idRecompensa: number): Promise<Usuario>;
  listarResgates(): Promise<ResgateRecompensa[]>;
}

export interface AdminApi {
  listarUsuarios(): Promise<Usuario[]>;
  alterarPapel(idUsuario: number, papel: Papel): Promise<Usuario>;
  listarRecompensas(): Promise<Recompensa[]>;
  salvarRecompensa(id: number | null, dados: RecompensaRequest): Promise<Recompensa>;
  removerRecompensa(id: number): Promise<void>;
  listarTarefas(): Promise<Tarefa[]>;
  salvarTarefa(id: number | null, dados: TarefaRequest): Promise<Tarefa>;
  removerTarefa(id: number): Promise<void>;
  listarQuizzes(): Promise<Quiz[]>;
  criarQuiz(dados: QuizRequest): Promise<Quiz>;
  removerQuiz(id: number): Promise<void>;
}
