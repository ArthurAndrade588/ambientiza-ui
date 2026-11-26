import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensagemErro } from '../utils';

export default function CadastroPage() {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await cadastrar({ nome, email, senha });
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="page auth">
      <header>
        <h1 className="title">Criar conta</h1>
        <p className="subtitle">Comece sua jornada sustentável</p>
      </header>

      <form className="card form" onSubmit={enviar}>
        <label className="field">
          <span>Nome</span>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="field">
          <span>Senha</span>
          <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} autoComplete="new-password" />
        </label>
        {erro && <p className="error" role="alert">{erro}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <p className="hint centro">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </main>
  );
}
