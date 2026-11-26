import { useState } from 'react';
import AdminUsuarios from './admin/AdminUsuarios';
import AdminRecompensas from './admin/AdminRecompensas';
import AdminTarefas from './admin/AdminTarefas';
import AdminQuizzes from './admin/AdminQuizzes';

const ABAS = {
  usuarios: { rotulo: 'Usuários', Componente: AdminUsuarios },
  recompensas: { rotulo: 'Loja', Componente: AdminRecompensas },
  tarefas: { rotulo: 'Missões', Componente: AdminTarefas },
  quizzes: { rotulo: 'Quizzes', Componente: AdminQuizzes },
} as const;

type Aba = keyof typeof ABAS;

export default function Admin() {
  const [aba, setAba] = useState<Aba>('usuarios');
  const { Componente } = ABAS[aba];

  return (
    <>
      <header>
        <h1 className="title">Administração</h1>
        <p className="subtitle">Gerencie usuários, loja, missões e quizzes</p>
      </header>
      <div className="tabs" role="tablist">
        {(Object.keys(ABAS) as Aba[]).map((chave) => (
          <button
            key={chave}
            type="button"
            role="tab"
            aria-selected={aba === chave}
            className={aba === chave ? 'tab active' : 'tab'}
            onClick={() => setAba(chave)}
          >
            {ABAS[chave].rotulo}
          </button>
        ))}
      </div>
      <Componente />
    </>
  );
}
