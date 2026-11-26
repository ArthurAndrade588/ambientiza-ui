import { useEffect, useState } from 'react';
import { useAuth, useUsuario } from '../context/AuthContext';
import { api } from '../services/api';
import type { Estatisticas, ResgateRecompensa } from '../types';
import { formatarPontos, mensagemErro, mesAno, semanaOfensiva } from '../utils';

export default function Perfil() {
  const usuario = useUsuario();
  const { sair } = useAuth();
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [resgates, setResgates] = useState<ResgateRecompensa[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.buscarEstatisticas(), api.listarResgates()])
      .then(([e, r]) => {
        setEstatisticas(e);
        setResgates(r);
      })
      .catch((e) => setErro(mensagemErro(e)));
  }, [usuario.saldo]);

  const semana = semanaOfensiva(usuario.ultimaAtividade, usuario.ofensivaAtual);

  return (
    <>
      <header className="profile-header">
        <div className="avatar" aria-hidden="true">{usuario.nome.charAt(0).toUpperCase()}</div>
        <div>
          <h1 className="profile-name">{usuario.nome}</h1>
          <span className="subtitle">Membro desde {mesAno(usuario.criadoEm)}</span>
        </div>
      </header>

      <section className="card">
        <h2 className="card-title no-border">
          Ofensiva atual: {usuario.ofensivaAtual} {usuario.ofensivaAtual === 1 ? 'dia' : 'dias'}
        </h2>
        <ul className="week">
          {semana.map((d, i) => (
            <li key={i} className="day">
              <span className={`dot ${d.ativo ? 'on' : ''}`} />
              <span className={d.hoje ? 'today' : ''}>{d.letra}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="stat-grid">
        <div className="card">
          <span className="stat-label">Tarefas feitas</span>
          <strong className="stat-value">{estatisticas?.tarefasFeitas ?? '–'}</strong>
        </div>
        <div className="card">
          <span className="stat-label">Quizzes</span>
          <strong className="stat-value">{estatisticas?.quizzesFeitos ?? '–'}</strong>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Últimos resgates</h2>
        {resgates?.length === 0 && <p className="hint">Nenhum resgate ainda.</p>}
        <ul className="lista">
          {resgates?.slice(0, 5).map((r) => (
            <li key={r.idResgate} className="list-row">
              <span>{r.nomeRecompensa}</span>
              <span className="muted-right">−{formatarPontos(r.pontosGastos)} pts</span>
            </li>
          ))}
        </ul>
      </section>

      {erro && <p className="error" role="alert">{erro}</p>}

      <button type="button" className="btn btn-outline btn-block" onClick={sair}>
        Sair da conta
      </button>
    </>
  );
}
