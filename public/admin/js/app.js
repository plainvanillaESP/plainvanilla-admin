// ============================================
// PLAIN VANILLA ADMIN - APP
// Diseño Apple-style: limpio, elegante, minimalista
// ============================================

const { useState, useEffect } = React;

// Get components and utilities from window
const { Icon, Logo, Card, Spinner, ToastProvider, MicrosoftLogo, Avatar } = window;
const { api } = window;

// ============================================
// LOGIN VIEW - Elegant Apple-style
// ============================================

const LoginView = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pv-pink/10 to-pv-purple/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pv-purple/10 to-pv-pink/10 rounded-full blur-3xl" />
    </div>
    
    {/* Login card */}
    <div className="relative w-full max-w-md">
      <Card className="p-10 text-center" hover={false}>
        {/* Logo */}
        <div className="mb-8">
          <Logo className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Plain Vanilla</h1>
          <p className="text-gray-500 mt-1">Panel de Administración</p>
        </div>
        
        {/* Login button */}
        <a 
          href="/auth/login" 
          className="
            flex items-center justify-center gap-3
            w-full px-6 py-3.5 
            bg-white border border-gray-200 rounded-xl
            text-gray-700 font-medium
            shadow-sm
            hover:bg-gray-50 hover:border-gray-300 hover:shadow-md
            transition-all duration-200
            group
          "
        >
          <MicrosoftLogo className="w-5 h-5" />
          <span>Continuar con Microsoft</span>
          <Icon name="arrow_forward" className="text-gray-400 group-hover:translate-x-1 transition-transform" />
        </a>
        
        {/* Footer text */}
        <p className="mt-8 text-xs text-gray-400">
          Acceso exclusivo para el equipo de Plain Vanilla
        </p>
      </Card>
      
      {/* Brand footer */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-400">
          Powered by <span className="gradient-text font-medium">Plain Vanilla</span>
        </p>
      </div>
    </div>
  </div>
);

// ============================================
// SIDEBAR - Clean Apple-style navigation
// ============================================

const Sidebar = ({ user, currentView, setCurrentView, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: 'space_dashboard', label: 'Dashboard' },
    { id: 'projects', icon: 'folder_open', label: 'Proyectos' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Logo className="w-9 h-9" />
          <div>
            <div className="font-semibold text-gray-900 tracking-tight">Plain Vanilla</div>
            <div className="text-xs text-gray-400 font-medium">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          Menú
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5
              transition-all duration-200
              ${currentView === item.id
                ? 'bg-gradient-to-r from-pv-pink to-pv-purple text-white shadow-lg shadow-pv-purple/20'
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <Icon name={item.icon} className="text-xl" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        {/* User info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
          <Avatar name={user?.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate text-sm">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>
        
        {/* Logout button */}
        <button
          onClick={onLogout}
          className="
            w-full flex items-center justify-center gap-2 
            px-4 py-2.5 
            text-gray-500 text-sm font-medium
            hover:text-red-600 hover:bg-red-50 
            rounded-xl transition-all duration-200
          "
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

  // Loading state - matches the HTML loader
  if (loading) {
    return null; // Let the HTML loader show
  }

  // Not authenticated
  if (!user) {
    return <LoginView />;
  }

  // Main authenticated view
  return (
    <ToastProvider>
      <div className="h-screen flex bg-gray-50">
        <Sidebar
          user={user}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 overflow-auto">
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
