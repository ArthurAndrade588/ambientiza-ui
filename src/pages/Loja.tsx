import { useEffect, useState } from 'react';
import { useAuth, useUsuario } from '../context/AuthContext';
import { api } from '../services/api';
import type { Recompensa } from '../types';
import { formatarPontos, mensagemErro } from '../utils';

export default function Loja() {
  const usuario = useUsuario();
  const { atualizarUsuario } = useAuth();
  const [recompensas, setRecompensas] = useState<Recompensa[] | null>(null);
  const [pendente, setPendente] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    api
      .listarRecompensas()
      .then(setRecompensas)
      .catch((e) => setMensagem({ tipo: 'erro', texto: mensagemErro(e) }));
  }, []);

  async function resgatar(r: Recompensa) {
    if (!window.confirm(`Resgatar "${r.nome}" por ${formatarPontos(r.custo)} pts?`)) return;
    setPendente(r.idRecompensa);
    setMensagem(null);
    try {
      atualizarUsuario(await api.resgatar(r.idRecompensa));
      setRecompensas(await api.listarRecompensas());
      setMensagem({ tipo: 'ok', texto: `"${r.nome}" resgatado com sucesso!` });
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: mensagemErro(e) });
    } finally {
      setPendente(null);
    }
  }

  return (
    <>
      <h1 className="title">Loja de recompensas</h1>

      <section className="balance-card">
        <span className="stat-label">Seu saldo</span>
        <strong className="balance-value">{formatarPontos(usuario.saldo)} pts</strong>
      </section>

      {!recompensas && !mensagem && <p className="hint">Carregando recompensas...</p>}

      {recompensas?.map((r) => {
        const esgotado = r.estoque <= 0;
        const semSaldo = usuario.saldo < r.custo;
        return (
          <article key={r.idRecompensa} className="card reward">
            <div>
              <h2 className="reward-name">{r.nome}</h2>
              <span className="stat-label">
                {formatarPontos(r.custo)} pts · estoque {r.estoque}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => resgatar(r)}
              disabled={esgotado || semSaldo || pendente !== null}
            >
              {esgotado ? 'Esgotado' : semSaldo ? 'Sem saldo' : pendente === r.idRecompensa ? '...' : 'Resgatar'}
            </button>
          </article>
        );
      })}

      {mensagem && (
        <p className={mensagem.tipo === 'ok' ? 'feedback ok' : 'error'} role="status">
          {mensagem.texto}
        </p>
      )}

      <p className="hint">O resgate desconta seus pontos e registra o pedido de uma vez.</p>
    </>
  );
}
