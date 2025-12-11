// ============================================
// PLAIN VANILLA - APP
// Apple-style: minimal, clean, elegant
// ============================================

const { useState, useEffect } = React;
const { Icon, Logo, Button, Card, Spinner, ToastProvider } = window;

// ============================================
// LOGIN VIEW - Apple style
// ============================================

const LoginView = () => (
  <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center p-8">
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-10">
        <Logo className="w-14 h-14 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-apple-gray-600 tracking-tight">Plain Vanilla</h1>
        <p className="text-apple-gray-400 text-sm mt-1">Panel de administración</p>
      </div>
      
      {/* Login Card */}
      <Card className="p-8">
        <a 
          href="/auth/login" 
          className="
            flex items-center justify-center gap-3 w-full
            px-5 py-3 rounded-xl
            border border-apple-gray-200
            text-apple-gray-600 font-medium text-sm
            hover:bg-apple-gray-50 active:bg-apple-gray-100
            transition-all duration-150
          "
        >
          <window.MicrosoftLogo className="w-5 h-5" />
          Continuar con Microsoft
        </a>
        
        <p className="text-sm text-apple-gray-400 text-center mt-6">
          Usa tu cuenta @plainvanilla.ai
        </p>
      </Card>
    </div>
  </div>
);

// ============================================
// SIDEBAR - Apple style: clean, minimal
// ============================================

const Sidebar = ({ user, currentView, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: 'space_dashboard', label: 'Dashboard' },
    { id: 'projects', icon: 'folder', label: 'Proyectos' },
  ];

  return (
    <aside className="w-60 h-full bg-white border-r border-apple-gray-100 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-apple-gray-100">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <div>
            <h1 className="text-sm font-semibold text-apple-gray-600">Plain Vanilla</h1>
            <p className="text-sm text-apple-gray-400">Administración</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                text-sm font-medium transition-all duration-150
                ${currentView === item.id || (currentView === 'project-detail' && item.id === 'projects')
                  ? 'bg-apple-gray-100 text-apple-gray-600' 
                  : 'text-apple-gray-400 hover:text-apple-gray-600 hover:bg-apple-gray-50'
                }
              `}
            >
              <Icon name={item.icon} className="text-lg" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      
      {/* User */}
      <div className="p-3 border-t border-apple-gray-100">
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full pv-gradient flex items-center justify-center text-white text-sm font-medium">
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-apple-gray-600 truncate">{user?.name || 'Usuario'}</p>
            <p className="text-sm text-apple-gray-400 truncate">{user?.email || ''}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-apple-gray-400 hover:text-apple-red hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <Icon name="logout" className="text-lg" />
          </button>
        </div>
      </div>
    </aside>
  );
};

// ============================================
// MAIN APP
// ============================================

const App = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  const loadInitialData = async () => {
    try {
      const userData = await window.api.get('/api/me');
      setUser(userData);
      const projectsData = await window.api.get('/api/projects');
      setProjects(projectsData);
    } catch (e) {
      console.log('Not authenticated');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleNavigate = (view) => {
    setCurrentView(view);
    setSelectedProject(null);
  };

  const handleSelectProject = (id) => {
    setSelectedProject(id);
    setCurrentView('project-detail');
  };

  const handleLogout = () => {
    window.location.href = '/auth/logout';
  };

  const refreshProjects = async () => {
    const data = await window.api.get('/api/projects');
    setProjects(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-gray-50">
        <div className="text-center">
          <Spinner size="large" />
          <p className="mt-4 text-sm text-apple-gray-400">Cargando</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return window.DashboardView && (
          <window.DashboardView 
            projects={projects} 
            onSelectProject={handleSelectProject} 
          />
        );
      case 'projects':
        return window.ProjectsView && (
          <window.ProjectsView 
            projects={projects} 
            onSelectProject={handleSelectProject}
            onRefresh={refreshProjects}
          />
        );
      case 'project-detail':
        return window.ProjectDetailView && (
          <window.ProjectDetailView 
            projectId={selectedProject}
            onBack={() => handleNavigate('projects')}
            onRefresh={refreshProjects}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-apple-gray-50">
        <Sidebar 
          user={user}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </ToastProvider>
  );
};

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
