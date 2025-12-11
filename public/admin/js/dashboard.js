// ============================================
// PLAIN VANILLA ADMIN - DASHBOARD
// Vista principal del dashboard
// ============================================

const { useState, useMemo } = React;

// Get components and utilities from window
const { Icon, Card, Badge, Button } = window;
const { 
  formatDate, formatCurrency, getProjectDates, calculateProjectRevenue,
  getSessionStatus, getPhaseProgress 
} = window;

// ============================================
// DASHBOARD VIEW
// ============================================

const DashboardView = ({ projects, onSelectProject }) => {
  const [dateRange, setDateRange] = useState('all');
  
  // Process projects with dates and revenue
  const projectsWithData = useMemo(() => {
    return projects.map(p => ({
      ...p,
      ...getProjectDates(p),
      revenue: calculateProjectRevenue(p)
    }));
  }, [projects]);
  
  // Filter projects by date range
  const filteredProjects = useMemo(() => {
    return projectsWithData.filter(p => {
      if (dateRange === 'all') return true;
      if (!p.start) return false;
      
      const now = new Date();
      const startDate = new Date(p.start);
      
      if (dateRange === 'month') {
        return startDate.getMonth() === now.getMonth() && 
               startDate.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const projectQuarter = Math.floor(startDate.getMonth() / 3);
        return projectQuarter === quarter && startDate.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'year') {
        return startDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [projectsWithData, dateRange]);
  
  // Sort projects chronologically (no dates at the end)
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (!a.start && !b.start) return 0;
      if (!a.start) return 1;
      if (!b.start) return -1;
      return new Date(a.start) - new Date(b.start);
    });
  }, [filteredProjects]);
  
  // Calculate metrics
  const metrics = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.revenue.total, 0);
    
    // Get all upcoming sessions
    const allSessions = projects.flatMap(p => 
      (p.sessions || []).map(s => ({ ...s, projectName: p.name, projectId: p.id }))
    );
    const upcomingSessions = allSessions
      .filter(s => s.date && new Date(s.date + 'T' + (s.time || '00:00')) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
    
    // Calculate average progress
    const projectsWithPhases = projects.filter(p => (p.phases || []).length > 0);
    const avgProgress = projectsWithPhases.length > 0
      ? Math.round(projectsWithPhases.reduce((sum, p) => {
          const phases = p.phases || [];
          const phaseProgress = phases.reduce((ps, ph) => 
            ps + getPhaseProgress(ph.id, p.sessions || [], p.tasks || []), 0
          ) / phases.length;
          return sum + phaseProgress;
        }, 0) / projectsWithPhases.length)
      : 0;
    
    // Get urgent tasks
    const urgentTasks = projects.flatMap(p => 
      (p.tasks || [])
        .filter(t => t.priority === 'high' && t.status !== 'completed')
        .map(t => ({ ...t, projectName: p.name }))
    ).slice(0, 5);
    
    return { activeProjects, totalRevenue, upcomingSessions, avgProgress, urgentTasks };
  }, [projects, filteredProjects]);
  
  // Monthly revenue chart data
  const monthlyRevenue = useMemo(() => {
    const data = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    projectsWithData.forEach(p => {
      if (p.start) {
        const date = new Date(p.start);
        if (date.getFullYear() === currentYear) {
          data[date.getMonth()] += p.revenue.total;
        }
      }
    });
    
    return data;
  }, [projectsWithData]);
  
  const maxRevenue = Math.max(...monthlyRevenue, 1);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Vista general de tus proyectos</p>
        </div>
        <select 
          value={dateRange} 
          onChange={e => setDateRange(e.target.value)} 
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pv-purple/20"
        >
          <option value="all">Todo</option>
          <option value="month">Este mes</option>
          <option value="quarter">Trimestre</option>
          <option value="year">Este año</option>
        </select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{metrics.activeProjects}</div>
              <div className="text-gray-500 text-sm">Proyectos activos</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Icon name="folder" className="text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="text-gray-500 text-sm">Facturación</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Icon name="euro" className="text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{metrics.upcomingSessions.length}</div>
              <div className="text-gray-500 text-sm">Próximas sesiones</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Icon name="event" className="text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{metrics.avgProgress}%</div>
              <div className="text-gray-500 text-sm">Progreso medio</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center relative">
              <svg viewBox="0 0 36 36" className="w-10 h-10">
                <path 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" stroke="#fde68a" strokeWidth="3"
                />
                <path 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" stroke="#f59e0b" strokeWidth="3" 
                  strokeDasharray={`${metrics.avgProgress}, 100`}
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              Facturación mensual {new Date().getFullYear()}
            </h3>
            <div className="h-48 flex items-end gap-2">
              {monthlyRevenue.map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full gradient-bg rounded-t-lg transition-all hover:opacity-80 cursor-pointer" 
                    style={{ 
                      height: `${(value / maxRevenue) * 160}px`, 
                      minHeight: value > 0 ? '8px' : '0' 
                    }} 
                    title={formatCurrency(value)} 
                  />
                  <span className="text-xs text-gray-400">{months[i]}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects List */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Proyectos</h3>
              <span className="text-sm text-gray-400">{sortedProjects.length} proyectos</span>
            </div>
            <div className="space-y-2">
              {sortedProjects.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => onSelectProject(p.id)} 
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold">
                    {p.client?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{p.name}</div>
                    <div className="text-sm text-gray-400 truncate">{p.client}</div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="font-medium text-gray-800">{formatCurrency(p.revenue.total)}</div>
                    <div className="text-xs text-gray-400">
                      {p.start ? `${formatDate(p.start)} - ${formatDate(p.end)}` : 'Sin fechas'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.sharepoint && <window.SharePointIcon className="w-4 h-4 text-teal-600" />}
                    {p.teams && <window.TeamsIcon className="w-4 h-4 text-purple-600" />}
                    {p.planner && <window.PlannerIcon className="w-4 h-4 text-green-600" />}
                  </div>
                  <Icon name="chevron_right" className="text-gray-300" />
                </div>
              ))}
              {sortedProjects.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="folder_off" className="text-4xl mb-2" />
                  <div>No hay proyectos</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon name="event" className="text-blue-500" />
              Próximas sesiones
            </h3>
            <div className="space-y-3">
              {metrics.upcomingSessions.map(s => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="font-medium text-gray-800 text-sm">{s.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.projectName}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Icon name="schedule" className="text-gray-400 text-sm" />
                    <span className="text-gray-600">{formatDate(s.date)} {s.time}</span>
                    {s.type === 'online' && <Badge color="blue">Online</Badge>}
                  </div>
                </div>
              ))}
              {metrics.upcomingSessions.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No hay sesiones próximas
                </div>
              )}
            </div>
          </Card>

          {/* Urgent Tasks */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon name="priority_high" className="text-red-500" />
              Tareas urgentes
            </h3>
            <div className="space-y-2">
              {metrics.urgentTasks.map(t => (
                <div key={t.id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="font-medium text-gray-800 text-sm">{t.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{t.projectName}</div>
                  {t.dueDate && (
                    <div className="text-xs text-red-500 mt-1">
                      Vence: {formatDate(t.dueDate)}
                    </div>
                  )}
                </div>
              ))}
              {metrics.urgentTasks.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No hay tareas urgentes
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Export to window
window.DashboardView = DashboardView;
