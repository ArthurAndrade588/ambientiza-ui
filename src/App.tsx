import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Inicio from './pages/Inicio';
import QuizPage, { QuizLista } from './pages/Quiz';
import Loja from './pages/Loja';
import Perfil from './pages/Perfil';
import Login from './pages/Login';
import CadastroPage from './pages/Cadastro';
import Admin from './pages/Admin';

function Layout() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="page centro">Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  const admin = usuario.papel === 'ADMIN';

  return (
    <>
      <main className="page">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Navegação principal" style={{ gridTemplateColumns: `repeat(${admin ? 5 : 4}, 1fr)` }}>
        <NavLink to="/" end>Início</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/loja">Loja</NavLink>
        <NavLink to="/perfil">Perfil</NavLink>
        {admin && <NavLink to="/admin">Admin</NavLink>}
      </nav>
    </>
  );
}

function SomenteAdmin({ children }: { children: JSX.Element }) {
  const { usuario } = useAuth();
  return usuario?.papel === 'ADMIN' ? children : <Navigate to="/" replace />;
}

function SomenteVisitante({ children }: { children: JSX.Element }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  return usuario ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<SomenteVisitante><Login /></SomenteVisitante>} />
        <Route path="/cadastro" element={<SomenteVisitante><CadastroPage /></SomenteVisitante>} />
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="quiz" element={<QuizLista />} />
          <Route path="quiz/:idQuiz" element={<QuizPage />} />
          <Route path="loja" element={<Loja />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="admin" element={<SomenteAdmin><Admin /></SomenteAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
