import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../../services/api';
import type { Recompensa, RecompensaRequest } from '../../types';
import { formatarPontos, mensagemErro } from '../../utils';

const VAZIO: RecompensaRequest = { nome: '', descricao: '', custo: 0, estoque: 0 };

export default function AdminRecompensas() {
  const [itens, setItens] = useState<Recompensa[] | null>(null);
  const [form, setForm] = useState<RecompensaRequest>(VAZIO);
  const [editando, setEditando] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = () => adminApi.listarRecompensas().then(setItens).catch((e) => setErro(mensagemErro(e)));
  useEffect(() => {
    carregar();
  }, []);

  function editar(r: Recompensa) {
    setEditando(r.idRecompensa);
    setForm({ nome: r.nome, descricao: r.descricao, custo: r.custo, estoque: r.estoque });
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
      await adminApi.salvarRecompensa(editando, form);
      cancelar();
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  async function remover(r: Recompensa) {
    if (!window.confirm(`Remover "${r.nome}"?`)) return;
    setErro('');
    try {
      await adminApi.removerRecompensa(r.idRecompensa);
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }

  return (
    <>
      <form className="card form" onSubmit={salvar}>
        <h2 className="card-title">{editando ? 'Editar recompensa' : 'Nova recompensa'}</h2>
        <label className="field">
          <span>Nome</span>
          <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required maxLength={120} />
        </label>
        <label className="field">
          <span>Descrição</span>
          <input className="input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required maxLength={255} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Custo (pts)</span>
            <input className="input" type="number" min={0} value={form.custo} onChange={(e) => setForm({ ...form, custo: Number(e.target.value) })} required />
          </label>
          <label className="field">
            <span>Estoque</span>
            <input className="input" type="number" min={0} value={form.estoque} onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) })} required />
          </label>
        </div>
        {erro && <p className="error" role="alert">{erro}</p>}
        <div className="row-actions">
          {editando && <button type="button" className="btn btn-outline" onClick={cancelar}>Cancelar</button>}
          <button type="submit" className="btn btn-primary" disabled={enviando}>{editando ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>

      <section className="card">
        <h2 className="card-title">Recompensas</h2>
        <ul className="lista">
          {itens?.map((r) => (
            <li key={r.idRecompensa} className="list-row admin-row">
              <div className="admin-info">
                <strong>{r.nome}</strong>
                <span className="hint">{formatarPontos(r.custo)} pts · estoque {r.estoque}</span>
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn-outline btn-xs" onClick={() => editar(r)}>Editar</button>
                <button type="button" className="btn btn-danger btn-xs" onClick={() => remover(r)}>Remover</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
