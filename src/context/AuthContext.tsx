import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, EVENTO_SESSAO_EXPIRADA, tokenStorage } from '../services/api';
import type { Cadastro, LoginResponse, LoginUsuario, Usuario } from '../types';

interface AuthValor {
  usuario: Usuario | null;
  carregando: boolean;
  entrar(dados: LoginUsuario): Promise<void>;
  cadastrar(dados: Cadastro): Promise<void>;
  sair(): void;
  atualizarUsuario(usuario: Usuario): void;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const expirou = () => setUsuario(null);
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, expirou);

    if (!tokenStorage.obter()) {
      setCarregando(false);
    } else {
      api
        .buscarUsuario()
        .then(setUsuario)
        .catch(() => tokenStorage.limpar())
        .finally(() => setCarregando(false));
    }
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, expirou);
  }, []);

  const iniciarSessao = useCallback(({ token, usuario: u }: LoginResponse) => {
    tokenStorage.salvar(token);
    setUsuario(u);
  }, []);

  const valor = useMemo<AuthValor>(
    () => ({
      usuario,
      carregando,
      entrar: async (dados) => iniciarSessao(await api.login(dados)),
      cadastrar: async (dados) => iniciarSessao(await api.cadastrar(dados)),
      sair: () => {
        api.logout().catch(() => undefined);
        tokenStorage.limpar();
        setUsuario(null);
      },
      atualizarUsuario: setUsuario,
    }),
    [usuario, carregando, iniciarSessao],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function useUsuario(): Usuario {
  const { usuario } = useAuth();
  if (!usuario) throw new Error('Usuário não autenticado');
  return usuario;
}
