// ============================================
// PLAIN VANILLA ADMIN - APP
// Componente principal y Sidebar
// ============================================

const { useState, useEffect } = React;

// Get components and utilities from window
const { Icon, Logo, Card, Spinner, ToastProvider } = window;
const { api } = window;

// ============================================
// LOGIN VIEW
// ============================================

const LoginView = () => (
  <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
    <Card className="p-8 w-full max-w-sm text-center">
      <Logo className="w-20 h-20 mx-auto mb-4" />
      <h1 className="text-2xl font-bold gradient-text mb-2">Plain Vanilla</h1>
      <p className="text-gray-500 mb-6">Panel de Administración</p>
      <a 
        href="/auth/login" 
        className="block w-full gradient-bg text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
      >
        <span className="flex items-center justify-center gap-2">
          <Icon name="login" />
          Iniciar sesión con Microsoft
        </span>
      </a>
    </Card>
  </div>
);

// ============================================
// SIDEBAR
// ============================================

const Sidebar = ({ user, currentView, setCurrentView, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'projects', icon: 'folder', label: 'Proyectos' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <div>
            <div className="font-bold gradient-text">Plain Vanilla</div>
            <div className="text-xs text-gray-400">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
              currentView === item.id
                ? 'gradient-bg text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon name={item.icon} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <Icon name="logout" className="text-lg" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Check authentication
  const checkAuth = async () => {
    try {
      const userData = await api.get('/api/me');
      setUser(userData);
      loadProjects();
    } catch (e) {
      setUser(null);
    }
    setLoading(false);
  };

  // Load projects
  const loadProjects = async () => {
    try {
      const data = await api.get('/api/projects');
      setProjects(data);
    } catch (e) {
      console.error('Error loading projects:', e);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Handlers
  const handleLogout = () => {
    window.location.href = '/auth/logout';
  };

  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
    setCurrentView('project-detail');
  };

  const handleBackFromProject = () => {
    setSelectedProjectId(null);
    setCurrentView('projects');
    loadProjects();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center text-white">
          <Logo className="w-20 h-20 mx-auto mb-4 animate-pulse" />
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LoginView />;
  }

  // Main authenticated view
  return (
    <ToastProvider>
      <div className="h-screen flex">
        <Sidebar
          user={user}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 overflow-auto bg-gray-50">
          {currentView === 'dashboard' && window.DashboardView && (
            <window.DashboardView
              projects={projects}
              onSelectProject={handleSelectProject}
            />
          )}
          
          {currentView === 'projects' && window.ProjectsView && (
            <window.ProjectsView
              projects={projects}
              onSelectProject={handleSelectProject}
              onRefresh={loadProjects}
            />
          )}
          
          {currentView === 'project-detail' && selectedProjectId && window.ProjectDetailView && (
            <window.ProjectDetailView
              projectId={selectedProjectId}
              onBack={handleBackFromProject}
              onRefresh={loadProjects}
            />
          )}
        </div>
      </div>
    </ToastProvider>
  );
};

// ============================================
// RENDER APP
// ============================================

ReactDOM.render(<App />, document.getElementById('root'));
