import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUsuario } from '../context/AuthContext';
import { api } from '../services/api';
import type { QuizDisponivel, TarefaDoDia } from '../types';
import { formatarPontos, mensagemErro, primeiroNome } from '../utils';

export default function Inicio() {
  const usuario = useUsuario();
  const { atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [tarefas, setTarefas] = useState<TarefaDoDia[] | null>(null);
  const [quizzes, setQuizzes] = useState<QuizDisponivel[] | null>(null);
  const [pendente, setPendente] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.listarTarefasDoDia(), api.listarQuizzes().catch(() => null)])
      .then(([t, q]) => {
        setTarefas(t);
        setQuizzes(q);
      })
      .catch((e) => setErro(mensagemErro(e)));
  }, [usuario.idUsuario]);

  async function concluir(tarefa: TarefaDoDia) {
    if (tarefa.concluida || pendente !== null) return;
    setPendente(tarefa.idTarefa);
    setErro('');
    try {
      atualizarUsuario(await api.concluirTarefa(tarefa.idTarefa));
      setTarefas((ts) => ts?.map((t) => (t.idTarefa === tarefa.idTarefa ? { ...t, concluida: true } : t)) ?? null);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setPendente(null);
    }
  }

  const pendentes = quizzes?.filter((q) => !q.tentativa).length ?? null;
  const emAndamento = quizzes?.some((q) => !q.tentativa && q.respondidas > 0) ?? false;

  return (
    <>
      <header>
        <h1 className="title">Olá, {primeiroNome(usuario.nome)}</h1>
        <p className="subtitle">Continue sua jornada sustentável</p>
      </header>

      <section className="stat-grid">
        <div className="card">
          <span className="stat-label">Ofensiva</span>
          <strong className="stat-value">{usuario.ofensivaAtual} {usuario.ofensivaAtual === 1 ? 'dia' : 'dias'}</strong>
        </div>
        <div className="card">
          <span className="stat-label">Saldo</span>
          <strong className="stat-value">{formatarPontos(usuario.saldo)} pts</strong>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Missões de hoje</h2>
        {!tarefas && !erro && <p className="hint">Carregando missões...</p>}
        <ul className="lista">
          {tarefas?.map((t) => (
            <li key={t.idTarefa} className="list-row">
              <button
                type="button"
                className={`check ${t.concluida ? 'done' : ''}`}
                onClick={() => concluir(t)}
                disabled={t.concluida || pendente !== null}
                aria-label={t.concluida ? `${t.titulo} concluída` : `Concluir ${t.titulo}`}
              >
                {t.concluida && (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`mission-title ${t.concluida ? 'done' : ''}`}>{t.titulo}</span>
              <span className="points">+{t.pontosRecompensa}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="quiz-banner">
        <h2>Quizzes</h2>
        {tarefas && (!quizzes || quizzes.length === 0) ? (
          <p>Nenhum quiz disponível hoje. Volte mais tarde!</p>
        ) : pendentes === 0 ? (
          <>
            <p>Você concluiu todos os {quizzes!.length} quizzes disponíveis. Volte amanhã!</p>
            <button type="button" className="btn btn-accent btn-block" onClick={() => navigate('/quiz')}>
              Ver resultados
            </button>
          </>
        ) : (
          <>
            <p>
              {pendentes === 1 ? '1 quiz disponível' : `${pendentes ?? ''} quizzes disponíveis`}. Acerte para ganhar pontos.
            </p>
            <button type="button" className="btn btn-accent btn-block" onClick={() => navigate('/quiz')}>
              {emAndamento ? 'Continuar' : 'Jogar agora'}
            </button>
          </>
        )}
      </section>

      {erro && <p className="error" role="alert">{erro}</p>}
    </>
  );
}
