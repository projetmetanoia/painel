import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import axios from 'axios';

// =============================================================================
// 1. CONFIGURAÇÃO DA API (AXIOS)
// =============================================================================
const api = axios.create({
    baseURL: 'https://acesso.projetometanoia.com.br', // URL da sua API
});

// =============================================================================
// 2. CONTEXTO DE AUTENTICAÇÃO
// =============================================================================
export const AuthContext = createContext(null);

// =============================================================================
// 3. COMPONENTES E PÁGINAS
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
            const response = await api.post('/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const { access_token } = response.data;
            
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
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-teal-400 mb-6">Painel Metanoia</h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-400 mb-2" htmlFor="username">Usuário</label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2" htmlFor="password">Senha</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
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
                    <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Sair</button>
                </div>
            </header>
            <main className="p-8">
                <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div onClick={() => navigate('/learning-paths')} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                        <h3 className="text-xl font-semibold text-teal-400 mb-2">Trilhas de Aprendizagem</h3>
                        <p className="text-gray-400">Visualizar e gerenciar as trilhas.</p>
                    </div>
                    {user?.role === 'admin' && (
                         <div onClick={() => navigate('/users')} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                            <h3 className="text-xl font-semibold text-teal-400 mb-2">Usuários</h3>
                            <p className="text-gray-400">Gerenciar todos os usuários do sistema.</p>
                        </div>
                    )}
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
                setError('Não foi possível carregar as trilhas.');
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
                    <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Sair</button>
                </div>
            </header>
            <main className="p-8">
                {loading && <p className="text-center text-xl">Carregando trilhas...</p>}
                {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg text-center">{error}</p>}
                
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paths.map(path => (
                            <div key={path.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                                <img src={path.cover_image ? `${api.defaults.baseURL}${path.cover_image}` : 'https://placehold.co/600x400/0f172a/94a3b8?text=Sem+Capa'} alt={`Capa da trilha ${path.title}`} className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/0f172a/94a3b8?text=Erro'; }}/>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-teal-400 mb-2">{path.title}</h3>
                                    <p className="text-gray-400 mb-4 flex-grow">{path.description}</p>
                                    <div className="flex justify-between items-center mt-4">
                                         <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                                            {path.plan_required}
                                        </span>
                                        <button onClick={() => navigate(`/learning-paths/${path.id}`)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition">
                                            Ver Aulas
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

/*******************************************************************************
 * pages/LearningPathDetailPage.js: Detalhes de uma Trilha e suas aulas
 *******************************************************************************/
function LearningPathDetailPage({ navigate, pathId }) {
    const { user, logout } = useContext(AuthContext);
    const [pathDetails, setPathDetails] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);

    const fetchPathData = async () => {
        setLoading(true);
        try {
            const [pathsResponse, lessonsResponse] = await Promise.all([
                api.get('/learning_paths/'),
                api.get(`/learning_paths/${pathId}/lessons/`)
            ]);
            const currentPath = pathsResponse.data.find(p => p.id === parseInt(pathId));
            setPathDetails(currentPath);
            setLessons(lessonsResponse.data);
        } catch (err) {
            setError('Não foi possível carregar os detalhes da trilha.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPathData();
    }, [pathId]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
                 <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/learning-paths')} className="text-teal-400 hover:text-teal-300 transition-colors">&larr; Voltar para Trilhas</button>
                    <h1 className="text-xl font-bold text-teal-400 truncate">{pathDetails?.title || 'Carregando...'}</h1>
                 </div>
                <div className="flex items-center">
                    <span className="mr-4">Olá, <strong className="font-semibold">{user?.username}</strong></span>
                    <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Sair</button>
                </div>
            </header>
            <main className="p-8">
                 {loading && <p className="text-center text-xl">Carregando aulas...</p>}
                 {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg text-center">{error}</p>}
                 {!loading && !error && (
                    <div>
                        <p className="text-gray-400 mb-8">{pathDetails?.description}</p>
                        <h2 className="text-2xl font-bold mb-4">Aulas</h2>
                        <div className="space-y-4">
                            {lessons.length > 0 ? lessons.map(lesson => (
                                <div key={lesson.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center hover:bg-gray-700 transition">
                                    <h3 className="text-lg font-semibold">{lesson.title}</h3>
                                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-3 rounded-md text-sm">Assistir</button>
                                </div>
                            )) : <p className="text-gray-500">Nenhuma aula cadastrada nesta trilha ainda.</p>}
                        </div>
                    </div>
                 )}
                 {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <div className="fixed bottom-8 right-8">
                            <button onClick={() => setModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl transform hover:scale-110 transition-transform">
                                +
                            </button>
                        </div>
                    )}
            </main>
            {isModalOpen && <AddLessonModal pathId={pathId} closeModal={() => setModalOpen(false)} onLessonAdded={fetchPathData} />}
        </div>
    );
}

/*******************************************************************************
 * components/AddLessonModal.js: Modal para adicionar nova aula
 *******************************************************************************/
function AddLessonModal({ pathId, closeModal, onLessonAdded }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const modalRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (videoFile) formData.append('video_file', videoFile);
        if (imageFile) formData.append('image_file', imageFile);

        try {
            await api.post(`/learning_paths/${pathId}/lessons/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onLessonAdded(); // Recarrega a lista de aulas na página
            closeModal(); // Fecha o modal
        } catch (err) {
            setError('Falha ao criar a aula. Verifique os campos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    // Fecha o modal se clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeModal();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeModal]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl text-white">
                <h2 className="text-2xl font-bold mb-6 text-teal-400">Adicionar Nova Aula</h2>
                <form onSubmit={handleSubmit}>
                     <div className="mb-4">
                        <label className="block text-gray-400 mb-2" htmlFor="title">Título da Aula</label>
                        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" required />
                    </div>
                     <div className="mb-4">
                        <label className="block text-gray-400 mb-2" htmlFor="content">Conteúdo (Texto)</label>
                        <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 h-32" required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                           <label className="block text-gray-400 mb-2" htmlFor="video_file">Vídeo (Opcional)</label>
                           <input id="video_file" type="file" onChange={(e) => setVideoFile(e.target.files[0])} accept="video/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700" />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2" htmlFor="image_file">Imagem (Opcional)</label>
                            <input id="image_file" type="file" onChange={(e) => setImageFile(e.target.files[0])} accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700"/>
                        </div>
                     </div>
                    {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-center">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                            {loading ? 'Salvando...' : 'Salvar Aula'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/*******************************************************************************
 * pages/UsersPage.js: Página de gerenciamento de usuários (Admin)
 *******************************************************************************/
function UsersPage({ navigate }) {
    const { user, logout } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') {
            setError('Acesso negado.');
            setLoading(false);
            return;
        }
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users/');
                setUsers(response.data);
            } catch (err) {
                setError('Não foi possível carregar os usuários.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
                 <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-teal-400 hover:text-teal-300 transition-colors">&larr; Voltar</button>
                    <h1 className="text-xl font-bold text-teal-400">Gerenciamento de Usuários</h1>
                 </div>
                 <div className="flex items-center">
                    <span className="mr-4">Olá, <strong className="font-semibold">{user?.username}</strong></span>
                    <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Sair</button>
                </div>
            </header>
            <main className="p-8">
                 {loading && <p className="text-center text-xl">Carregando usuários...</p>}
                 {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg text-center">{error}</p>}
                 {!loading && !error && (
                     <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">ID</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Usuário</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Perfil</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Plano</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-700">
                                        <td className="px-5 py-5 border-b border-gray-700 text-sm">{u.id}</td>
                                        <td className="px-5 py-5 border-b border-gray-700 text-sm">{u.username}</td>
                                        <td className="px-5 py-5 border-b border-gray-700 text-sm">{u.email}</td>
                                        <td className="px-5 py-5 border-b border-gray-700 text-sm">{u.role}</td>
                                        <td className="px-5 py-5 border-b border-gray-700 text-sm">{u.plan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 )}
            </main>
        </div>
    );
}


// =============================================================================
// 4. COMPONENTE PRINCIPAL (APP)
// =============================================================================

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
    const [page, setPage] = useState(window.location.pathname);
    const [auth, setAuth] = useState({ token: null, user: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setAuth({ token, user: JSON.parse(user) });
        }
        setLoading(false);
    }, []);
    
    useEffect(() => {
        const interceptor = api.interceptors.response.use(response => response, error => {
            if (error.response && error.response.status === 401) {
                logout(); // Função de logout do contexto para limpar o estado
            }
            return Promise.reject(error);
        });
        return () => api.interceptors.response.eject(interceptor);
    }, []);

    const navigate = (path) => {
        window.history.pushState({}, '', path);
        setPage(path);
    };
    
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setAuth({ token: null, user: null });
        navigate('/login');
    };

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
        logout,
    };

    const renderPage = () => {
        const learningPathDetailRegex = /^\/learning-paths\/(\d+)$/;
        const pathDetailMatch = page.match(learningPathDetailRegex);

        if (page === '/' && auth.token) {
             navigate('/dashboard');
             return <PrivateRoute><DashboardPage navigate={navigate} /></PrivateRoute>;
        }
        if (pathDetailMatch) {
            const pathId = pathDetailMatch[1];
            return <PrivateRoute><LearningPathDetailPage navigate={navigate} pathId={pathId} /></PrivateRoute>;
        }

        switch (page) {
            case '/login': return <LoginPage navigate={navigate} />;
            case '/dashboard': return <PrivateRoute><DashboardPage navigate={navigate} /></PrivateRoute>;
            case '/learning-paths': return <PrivateRoute><LearningPathsPage navigate={navigate} /></PrivateRoute>;
            case '/users': return <PrivateRoute><UsersPage navigate={navigate} /></PrivateRoute>;
            default: return auth.token ? <PrivateRoute><DashboardPage navigate={navigate} /></PrivateRoute> : <LoginPage navigate={navigate}/>;
        }
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {renderPage()}
        </AuthContext.Provider>
    );
}
