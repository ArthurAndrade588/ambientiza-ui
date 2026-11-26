import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useUsuario } from '../context/AuthContext';
import { api } from '../services/api';
import type { QuizDisponivel, QuizDoDia, QuizTentativaDiaria, ResultadoResposta } from '../types';
import { diasParaExpirar, mensagemErro, PONTOS_POR_DIFICULDADE, ROTULO_DIFICULDADE } from '../utils';

export function QuizLista() {
  const usuario = useUsuario();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizDisponivel[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .listarQuizzes()
      .then(setQuizzes)
      .catch((e) => setErro(mensagemErro(e)));
  }, [usuario.idUsuario]);

  if (!quizzes) {
    return erro ? <p className="error" role="alert">{erro}</p> : <p className="hint">Carregando quizzes...</p>;
  }

  return (
    <>
      <h1 className="title">Quizzes</h1>
      {quizzes.length === 0 ? (
        <p className="hint">Nenhum quiz disponível hoje. Volte mais tarde!</p>
      ) : (
        <p className="hint">
          Cada quiz pode ser feito uma vez. Perguntas fáceis valem 10 pts, médias 30 pts e difíceis 50 pts.
          Feito no dia, vale a pontuação total; quizzes de até 7 dias atrás ainda podem ser feitos, mas valem metade.
        </p>
      )}
      <section className="card">
        <ul className="lista">
          {quizzes.map(({ quiz, respondidas, tentativa, valeMetade }) => (
            <li key={quiz.idQuiz} className="list-row">
              <span className="mission-title">
                {quiz.titulo}
                <br />
                <small className="hint">
                  {tentativa
                    ? `Concluído: ${tentativa.acerto} de ${quiz.totalPerguntas} (+${tentativa.pontosGanhos} pts)`
                    : `${quiz.totalPerguntas} perguntas`}
                </small>
                {!tentativa && (
                  <>
                    <br />
                    {valeMetade ? (
                      <span className="selo selo-metade">
                        Atrasado · vale metade · {rotuloExpiracao(diasParaExpirar(quiz.dataDisponivel))}
                      </span>
                    ) : (
                      <span className="selo selo-integral">Quiz de hoje · pontos integrais</span>
                    )}
                  </>
                )}
              </span>
              <button
                type="button"
                className={tentativa ? 'btn' : 'btn btn-primary'}
                onClick={() => navigate(`/quiz/${quiz.idQuiz}`)}
              >
                {tentativa ? 'Ver resultado' : respondidas > 0 ? 'Continuar' : 'Jogar'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function rotuloExpiracao(dias: number): string {
  if (dias <= 0) return 'último dia';
  return dias === 1 ? 'expira amanhã' : `expira em ${dias} dias`;
}

export default function QuizPage() {
  const usuario = useUsuario();
  const { atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const idQuiz = Number(useParams().idQuiz);
  const [dados, setDados] = useState<QuizDoDia | null>(null);
  const [tentativa, setTentativa] = useState<QuizTentativaDiaria | null>(null);
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoResposta | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setDados(null);
    setSelecionada(null);
    setResultado(null);
    api
      .buscarQuiz(idQuiz)
      .then((q) => {
        setDados(q);
        setTentativa(q.tentativa);
        setIndice(q.respondidas.length);
      })
      .catch((e) => setErro(mensagemErro(e)));
  }, [usuario.idUsuario, idQuiz]);

  async function executar(acao: () => Promise<void>) {
    setEnviando(true);
    setErro('');
    try {
      await acao();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setEnviando(false);
    }
  }

  const confirmar = (idPergunta: number) =>
    executar(async () => {
      if (selecionada === null) return;
      setResultado(await api.responderPergunta(idPergunta, selecionada));
    });

  const finalizar = () =>
    executar(async () => {
      const r = await api.finalizarQuiz(idQuiz);
      atualizarUsuario(r.usuario);
      setTentativa(r.tentativa);
    });

  function proxima() {
    if (!dados) return;
    if (indice + 1 >= dados.perguntas.length) {
      setIndice(dados.perguntas.length);
      finalizar();
      return;
    }
    setIndice(indice + 1);
    setSelecionada(null);
    setResultado(null);
  }

  if (!dados) {
    return erro ? <p className="error" role="alert">{erro}</p> : <p className="hint">Carregando quiz...</p>;
  }

  const total = dados.perguntas.length;

  if (tentativa) {
    return (
      <>
        <h1 className="title">{dados.quiz.titulo} concluído</h1>
        <section className="card resultado">
          <span className="stat-label">Você acertou</span>
          <strong className="stat-value">{tentativa.acerto} de {total}</strong>
          <span className="points-lg">+{tentativa.pontosGanhos} pts</span>
          {tentativa.dataJogada !== dados.quiz.dataDisponivel && (
            <span className="hint">Feito depois do dia do quiz: metade dos pontos.</span>
          )}
        </section>
        <p className="hint">Você já concluiu este quiz. Confira os outros quizzes disponíveis!</p>
        <div className="quiz-footer">
          <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/quiz')}>
            Ver outros quizzes
          </button>
        </div>
      </>
    );
  }

  if (indice >= total) {
    return (
      <>
        <h1 className="title">Quase lá!</h1>
        <p className="hint">Você respondeu todas as perguntas.</p>
        {erro && <p className="error" role="alert">{erro}</p>}
        <div className="quiz-footer">
          <button type="button" className="btn btn-primary btn-block" onClick={finalizar} disabled={enviando}>
            {enviando ? 'Calculando...' : 'Ver resultado'}
          </button>
        </div>
      </>
    );
  }

  const pergunta = dados.perguntas[indice];
  const ultima = indice + 1 === total;
  const valorIntegral = pergunta.pontos ?? PONTOS_POR_DIFICULDADE[pergunta.nivelDificuldade];
  const valorPergunta = dados.valeMetade ? Math.floor(valorIntegral / 2) : valorIntegral;

  function classeOpcao(id: number) {
    if (resultado) {
      if (id === resultado.idAlternativaCorreta) return 'option correct';
      if (id === selecionada) return 'option wrong';
      return 'option';
    }
    return id === selecionada ? 'option selected' : 'option';
  }

  return (
    <>
      <div className="quiz-header">
        <span className="hint">Pergunta {indice + 1} de {total}</span>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={indice + 1}>
          <span style={{ width: `${((indice + 1) / total) * 100}%` }} />
        </div>
      </div>

      <span className={`dificuldade dificuldade-${pergunta.nivelDificuldade.toLowerCase()}`}>
        {ROTULO_DIFICULDADE[pergunta.nivelDificuldade]} · {valorPergunta} pts
        {dados.valeMetade && <s className="valor-original">{valorIntegral}</s>}
      </span>
      {dados.valeMetade && indice === 0 && !resultado && (
        <p className="hint">Este quiz é de um dia anterior, então cada acerto vale metade dos pontos.</p>
      )}
      <h1 className="question">{pergunta.enunciado}</h1>

      <div className="options" role="radiogroup" aria-label="Alternativas">
        {pergunta.alternativas.map((a) => (
          <button
            key={a.idQuizAlternativas}
            type="button"
            role="radio"
            aria-checked={selecionada === a.idQuizAlternativas}
            className={classeOpcao(a.idQuizAlternativas)}
            onClick={() => !resultado && setSelecionada(a.idQuizAlternativas)}
            disabled={enviando || (resultado !== null && a.idQuizAlternativas !== selecionada && a.idQuizAlternativas !== resultado.idAlternativaCorreta)}
          >
            {a.texto}
          </button>
        ))}
      </div>

      {resultado && (
        <p className={resultado.correta ? 'feedback ok' : 'feedback fail'} role="status">
          {resultado.correta ? `Resposta correta! +${valorPergunta} pts` : 'Resposta incorreta.'}
        </p>
      )}

      <div className="quiz-footer">
        {erro && <p className="error" role="alert">{erro}</p>}
        <p className="hint">
          {indice > 0 || resultado ? 'Sua tentativa neste quiz já está em andamento.' : 'Você tem 1 tentativa neste quiz.'}
        </p>
        {resultado ? (
          <button type="button" className="btn btn-primary btn-block" onClick={proxima} disabled={enviando}>
            {ultima ? 'Ver resultado' : 'Próxima pergunta'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => confirmar(pergunta.idPergunta)}
            disabled={selecionada === null || enviando}
          >
            {enviando ? 'Enviando...' : 'Confirmar resposta'}
          </button>
        )}
      </div>
    </>
  );
}
