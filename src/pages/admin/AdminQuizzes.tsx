import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../../services/api';
import type { NivelDificuldade, Quiz, QuizRequest, Temas } from '../../types';
import { hoje, mensagemErro, paraData } from '../../utils';

const TEMAS: Record<Temas, string> = {
  GESTAO_RECICLAGEM: 'Gestão de resíduos e reciclagem',
  CONSUMO_CONSCIENTE: 'Consumo consciente',
  PRESERVACAO_BIODIVERSIDADE_LOCAL: 'Biodiversidade local',
};

type PerguntaForm = QuizRequest['perguntas'][number];

const novaPergunta = (): PerguntaForm => ({
  enunciado: '',
  nivelDificuldade: 'FACIL',
  alternativas: [0, 1, 2, 3].map((i) => ({ texto: '', correta: i === 0 })),
});

const formVazio = (): QuizRequest => ({
  titulo: 'Quiz do dia',
  tema: 'GESTAO_RECICLAGEM',
  dataDisponivel: hoje(),
  perguntas: [novaPergunta()],
});

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [form, setForm] = useState<QuizRequest>(formVazio);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = () => adminApi.listarQuizzes().then(setQuizzes).catch((e) => setErro(mensagemErro(e)));
  useEffect(() => {
    carregar();
  }, []);

  function alterarPergunta(i: number, mudanca: Partial<PerguntaForm>) {
    setForm((f) => ({ ...f, perguntas: f.perguntas.map((p, j) => (j === i ? { ...p, ...mudanca } : p)) }));
  }

  function alterarAlternativa(i: number, k: number, texto: string) {
    const p = form.perguntas[i];
    alterarPergunta(i, { alternativas: p.alternativas.map((a, j) => (j === k ? { ...a, texto } : a)) });
  }

  function marcarCorreta(i: number, k: number) {
    const p = form.perguntas[i];
    alterarPergunta(i, { alternativas: p.alternativas.map((a, j) => ({ ...a, correta: j === k })) });
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setEnviando(true);
    try {
      await adminApi.criarQuiz(form);
      setForm(formVazio());
      setSucesso('Quiz criado com sucesso!');
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  async function remover(q: Quiz) {
    if (!window.confirm(`Remover "${q.titulo}" de ${paraData(q.dataDisponivel).toLocaleDateString('pt-BR')}?`)) return;
    setErro('');
    try {
      await adminApi.removerQuiz(q.idQuiz);
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }

  return (
    <>
      <form className="card form" onSubmit={salvar}>
        <h2 className="card-title">Novo quiz</h2>
        <label className="field">
          <span>Título</span>
          <input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required maxLength={120} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Tema</span>
            <select className="input" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value as Temas })}>
              {Object.entries(TEMAS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Disponível em</span>
            <input className="input" type="date" value={form.dataDisponivel} onChange={(e) => setForm({ ...form, dataDisponivel: e.target.value })} required />
          </label>
        </div>

        {form.perguntas.map((p, i) => (
          <fieldset key={i} className="pergunta-form">
            <legend>Pergunta {i + 1}</legend>
            <input
              className="input"
              placeholder="Enunciado"
              value={p.enunciado}
              onChange={(e) => alterarPergunta(i, { enunciado: e.target.value })}
              required
              maxLength={255}
            />
            <select
              className="input"
              value={p.nivelDificuldade}
              onChange={(e) => alterarPergunta(i, { nivelDificuldade: e.target.value as NivelDificuldade })}
              aria-label="Dificuldade"
            >
              <option value="FACIL">Fácil (10 pts)</option>
              <option value="MEDIO">Médio (30 pts)</option>
              <option value="DIFICIL">Difícil (50 pts)</option>
            </select>
            {p.alternativas.map((a, k) => (
              <div key={k} className="alternativa-form">
                <input
                  type="radio"
                  name={`correta-${i}`}
                  checked={a.correta}
                  onChange={() => marcarCorreta(i, k)}
                  aria-label={`Alternativa ${k + 1} é a correta`}
                />
                <input
                  className="input"
                  placeholder={`Alternativa ${k + 1}`}
                  value={a.texto}
                  onChange={(e) => alterarAlternativa(i, k, e.target.value)}
                  required
                  maxLength={255}
                />
              </div>
            ))}
            {form.perguntas.length > 1 && (
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setForm({ ...form, perguntas: form.perguntas.filter((_, j) => j !== i) })}
              >
                Remover pergunta
              </button>
            )}
          </fieldset>
        ))}

        <p className="hint">Marque o círculo da alternativa correta.</p>
        {erro && <p className="error" role="alert">{erro}</p>}
        {sucesso && <p className="feedback ok" role="status">{sucesso}</p>}
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setForm({ ...form, perguntas: [...form.perguntas, novaPergunta()] })}
            disabled={form.perguntas.length >= 20}
          >
            + Pergunta
          </button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>Criar quiz</button>
        </div>
      </form>

      <section className="card">
        <h2 className="card-title">Quizzes</h2>
        <ul className="lista">
          {quizzes?.map((q) => (
            <li key={q.idQuiz} className="list-row admin-row">
              <div className="admin-info">
                <strong>{q.titulo}</strong>
                <span className="hint">
                  {paraData(q.dataDisponivel).toLocaleDateString('pt-BR')} · {TEMAS[q.tema]} · {q.totalPerguntas} perguntas
                </span>
              </div>
              <button type="button" className="btn btn-danger btn-xs" onClick={() => remover(q)}>Remover</button>
            </li>
          ))}
        </ul>
        <p className="hint">O quiz do dia é o mais recente com data até hoje.</p>
      </section>
    </>
  );
}
