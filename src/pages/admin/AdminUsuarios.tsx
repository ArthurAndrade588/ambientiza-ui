import { useEffect, useState } from 'react';
import { useUsuario } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import type { Papel, Usuario } from '../../types';
import { formatarPontos, mensagemErro } from '../../utils';

export default function AdminUsuarios() {
  const eu = useUsuario();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    adminApi.listarUsuarios().then(setUsuarios).catch((e) => setErro(mensagemErro(e)));
  }, []);

  async function alterarPapel(u: Usuario, papel: Papel) {
    setErro('');
    try {
      const atualizado = await adminApi.alterarPapel(u.idUsuario, papel);
      setUsuarios((lista) => lista?.map((x) => (x.idUsuario === u.idUsuario ? atualizado : x)) ?? null);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  return (
    <section className="card">
      <h2 className="card-title">Usuários ({usuarios?.length ?? '…'})</h2>
      {erro && <p className="error" role="alert">{erro}</p>}
      <ul className="lista">
        {usuarios?.map((u) => (
          <li key={u.idUsuario} className="list-row admin-row">
            <div className="admin-info">
              <strong>{u.nome}</strong>
              <span className="hint">{u.email} · {formatarPontos(u.saldo)} pts</span>
            </div>
            <select
              className="input input-sm"
              value={u.papel}
              onChange={(e) => alterarPapel(u, e.target.value as Papel)}
              disabled={u.idUsuario === eu.idUsuario}
              aria-label={`Papel de ${u.nome}`}
            >
              <option value="USUARIO">Usuário</option>
              <option value="ADMIN">Admin</option>
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}
