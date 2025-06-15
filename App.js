import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

// =============================================================================
// 1. CONFIGURAÇÃO DA API (AXIOS)
// Movido para o topo do arquivo para ser acessível globalmente no escopo do módulo.
// =============================================================================
const api = axios.create({
    baseURL: 'https://acesso.projetometanoia.com.br', // URL da sua API
});

// =============================================================================
// 2. CONTEXTO DE AUTENTICAÇÃO
// Definido aqui para ser importado e usado pelos componentes.
// =============================================================================
export const AuthContext = createContext(null);

// =============================================================================
// 3. COMPONENTES DE PÁGINA
// Definidos como funções normais, sem 'export default', pois estarão no mesmo arquivo.
// =============================================================================

/*******************************************************************************
 * pages/LoginPage.js: Página de Login
 *******************************************************************************/
function LoginPage({ navigate }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        try {
            // 1. Obter o token
            const response = await api.post('/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const { access_token } = response.data;
            
            // 2. Com o token, buscar a lista de usuários para encontrar o usuário atual
            // **MELHORIA FUTURA:** Substituir por um endpoint GET /users/me
            const userResponse = await api.get('/users/', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const currentUser = userResponse.data.find(u => u.username === username);

            if (currentUser) {
                login(access_token, currentUser);
            } else {
                 setError('Não foi possível encontrar os dados do usuário após o login.');
            }

        } catch (err) {
            setError('Falha no login. Verifique seu usuário e senha.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-teal-400 mb-6">Painel Metanoia</h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-400 mb-2" htmlFor="username">Usuário</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2" htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                        />
                    </div>
                    {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

/*******************************************************************************
 * pages/DashboardPage.js: Painel Principal pós-login
 *******************************************************************************/
function DashboardPage({ navigate }) {
    const { user, logout } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold text-teal-400">Painel Metanoia</h1>
                <div className="flex items-center">
                    <span className="mr-4">Olá, <strong className="font-semibold">{user?.username}</strong> ({user?.role})</span>
                    <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                        Sair
                    </button>
                </div>
            </header>
            <main className="p-8">
                <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div onClick={() => navigate('/learning-paths')} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                        <h3 className="text-xl font-semibold text-teal-400 mb-2">Trilhas de Aprendizagem</h3>
                        <p className="text-gray-400">Visualizar e gerenciar as trilhas de aprendizagem disponíveis.</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                        <h3 className="text-xl font-semibold text-teal-400 mb-2">Usuários</h3>
                        <p className="text-gray-400">Gerenciar usuários (apenas Admin).</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                        <h3 className="text-xl font-semibold text-teal-400 mb-2">Meu Progresso</h3>
                        <p className="text-gray-400">Verificar seu progresso nas trilhas (apenas Aluno).</p>
                    </div>
                </div>
            </main>
        </div>
    );
}


/*******************************************************************************
 * pages/LearningPathsPage.js: Página para listar as trilhas
 *******************************************************************************/
function LearningPathsPage({ navigate }) {
    const { user, logout } = useContext(AuthContext);
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPaths = async () => {
            try {
                const response = await api.get('/learning_paths/');
                setPaths(response.data);
            } catch (err) {
                setError('Não foi possível carregar as trilhas de aprendizagem.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPaths();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
                 <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-teal-400 hover:text-teal-300 transition-colors">&larr; Voltar</button>
                    <h1 className="text-xl font-bold text-teal-400">Trilhas de Aprendizagem</h1>
                 </div>
                <div className="flex items-center">
                    <span className="mr-4">Olá, <strong className="font-semibold">{user?.username}</strong></span>
                    <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                        Sair
                    </button>
                </div>
            </header>
            <main className="p-8">
                {loading && <p className="text-center text-xl">Carregando trilhas...</p>}
                {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg text-center">{error}</p>}
                
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paths.map(path => (
                            <div key={path.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                                <img 
                                    src={path.cover_image ? `${api.defaults.baseURL}${path.cover_image}` : 'https://placehold.co/600x400/0f172a/94a3b8?text=Sem+Capa'} 
                                    alt={`Capa da trilha ${path.title}`}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/0f172a/94a3b8?text=Erro+na+Imagem'; }}
                                />
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-teal-400 mb-2">{path.title}</h3>
                                    <p className="text-gray-400 mb-4 h-20 overflow-hidden text-ellipsis">{path.description}</p>
                                    <div className="flex justify-between items-center mt-4">
                                         <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                                            Plano: {path.plan_required}
                                        </span>
                                        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                                            Ver Aulas
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <div className="fixed bottom-8 right-8">
                            <button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl transform hover:scale-110 transition-transform">
                                +
                            </button>
                        </div>
                    )}
            </main>
        </div>
    );
}

// =============================================================================
// 4. COMPONENTE PRINCIPAL (APP)
// Este é o único componente com 'export default'. Ele gerencia o estado global
// de autenticação e o roteamento.
// =============================================================================

// --- Componente de Rota Protegida ---
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-pulse text-xl">Carregando Painel...</div>
            </div>
        );
    }
    return isAuthenticated ? children : <LoginPage />;
};

export default function App() {
    // Roteamento simples baseado no estado
    const [page, setPage] = useState(window.location.pathname);
    // Estado de autenticação
    const [auth, setAuth] = useState({ token: null, user: null });
    const [loading, setLoading] = useState(true);

    // Efeito para carregar o token do localStorage ao iniciar
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setAuth({ token, user: JSON.parse(user) });
        }
        setLoading(false);
    }, []);
    
    // Interceptor para tratar erros de autenticação globalmente
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    // Token inválido ou expirado. Limpa o storage e redireciona para o login.
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete api.defaults.headers.common['Authorization'];
                    setAuth({ token: null, user: null });
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );

        // Limpa o interceptor quando o componente é desmontado
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);


    // Função para navegar entre páginas (simula react-router)
    const navigate = (path) => {
        window.history.pushState({}, '', path);
        setPage(path);
    };
    
    // Valor a ser compartilhado pelo Contexto de Autenticação
    const authContextValue = {
        isAuthenticated: !!auth.token,
        user: auth.user,
        token: auth.token,
        loading,
        login: (token, user) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setAuth({ token, user });
            navigate('/dashboard');
        },
        logout: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            setAuth({ token: null, user: null });
            navigate('/login');
        }
    };

    // Renderização da página atual
    const renderPage = () => {
        // Redireciona para o dashboard se já estiver logado e na raiz
        if (page === '/' && auth.token) {
             navigate('/dashboard');
             return <PrivateRoute><DashboardPage navigate={navigate} /></PrivateRoute>;
        }

        switch (page) {
            case '/login':
                return <LoginPage navigate={navigate} />;
            case '/dashboard':
                return <PrivateRoute><DashboardPage navigate={navigate} /></PrivateRoute>;
            case '/learning-paths':
                 return <PrivateRoute><LearningPathsPage navigate={navigate} /></PrivateRoute>;
            default:
                // Se a rota não for encontrada, decide para onde ir baseado no login
                return auth.token ? <PrivateRoute><DashboardPage navigate={navigate} /></PrivateRoute> : <LoginPage navigate={navigate}/>;
        }
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {renderPage()}
        </AuthContext.Provider>
    );
}
