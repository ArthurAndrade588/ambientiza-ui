import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../../services/api';
import type { Tarefa, TarefaRequest, Tipo } from '../../types';
import { mensagemErro } from '../../utils';

const VAZIO: TarefaRequest = { titulo: '', descricao: '', pontosRecompensa: 10, tipo: 'DIARIO' };

export default function AdminTarefas() {
  const [itens, setItens] = useState<Tarefa[] | null>(null);
  const [form, setForm] = useState<TarefaRequest>(VAZIO);
  const [editando, setEditando] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = () => adminApi.listarTarefas().then(setItens).catch((e) => setErro(mensagemErro(e)));
  useEffect(() => {
    carregar();
  }, []);

  function editar(t: Tarefa) {
    setEditando(t.idTarefa);
    setForm({ titulo: t.titulo, descricao: t.descricao, pontosRecompensa: t.pontosRecompensa, tipo: t.tipo });
  }

  function cancelar() {
    setEditando(null);
    setForm(VAZIO);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await adminApi.salvarTarefa(editando, form);
      cancelar();
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  async function remover(t: Tarefa) {
    if (!window.confirm(`Remover "${t.titulo}"?`)) return;
    setErro('');
    try {
      await adminApi.removerTarefa(t.idTarefa);
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }

  return (
    <>
      <form className="card form" onSubmit={salvar}>
        <h2 className="card-title">{editando ? 'Editar missão' : 'Nova missão'}</h2>
        <label className="field">
          <span>Título</span>
          <input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required maxLength={120} />
        </label>
        <label className="field">
          <span>Descrição</span>
          <input className="input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required maxLength={255} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Pontos</span>
            <input className="input" type="number" min={0} value={form.pontosRecompensa} onChange={(e) => setForm({ ...form, pontosRecompensa: Number(e.target.value) })} required />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Tipo })}>
              <option value="DIARIO">Diária</option>
              <option value="SEMANAL">Semanal</option>
            </select>
          </label>
        </div>
        {erro && <p className="error" role="alert">{erro}</p>}
        <div className="row-actions">
          {editando && <button type="button" className="btn btn-outline" onClick={cancelar}>Cancelar</button>}
          <button type="submit" className="btn btn-primary" disabled={enviando}>{editando ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>

      <section className="card">
        <h2 className="card-title">Missões</h2>
        <ul className="lista">
          {itens?.map((t) => (
            <li key={t.idTarefa} className="list-row admin-row">
              <div className="admin-info">
                <strong>{t.titulo}</strong>
                <span className="hint">+{t.pontosRecompensa} pts · {t.tipo === 'DIARIO' ? 'diária' : 'semanal'}</span>
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn-outline btn-xs" onClick={() => editar(t)}>Editar</button>
                <button type="button" className="btn btn-danger btn-xs" onClick={() => remover(t)}>Remover</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
