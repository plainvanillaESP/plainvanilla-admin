// ============================================
// PLAIN VANILLA ADMIN - DASHBOARD
// Diseño Apple-style: limpio, elegante, minimalista
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vista general de tus proyectos</p>
        </div>
        <select 
          value={dateRange} 
          onChange={e => setDateRange(e.target.value)} 
          className="
            px-4 py-2.5 
            bg-white border border-gray-200 rounded-xl
            text-gray-700 text-sm font-medium
            focus:outline-none focus:ring-4 focus:ring-pv-purple/10 focus:border-pv-purple
            transition-all cursor-pointer
            appearance-none
            bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2224%22%20height%3d%2224%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]
            bg-[length:18px] bg-[right_12px_center] bg-no-repeat pr-10
          "
        >
          <option value="all">Todo el tiempo</option>
          <option value="month">Este mes</option>
          <option value="quarter">Este trimestre</option>
          <option value="year">Este año</option>
        </select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Active Projects */}
        <Card className="p-6" hover={false}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Proyectos activos</p>
              <p className="text-3xl font-semibold text-gray-900">{metrics.activeProjects}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 flex items-center justify-center">
              <Icon name="folder_open" className="text-purple-600" />
            </div>
          </div>
        </Card>
        
        {/* Revenue */}
        <Card className="p-6" hover={false}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Facturación</p>
              <p className="text-3xl font-semibold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 flex items-center justify-center">
              <Icon name="euro" className="text-emerald-600" />
            </div>
          </div>
        </Card>
        
        {/* Upcoming Sessions */}
        <Card className="p-6" hover={false}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Próximas sesiones</p>
              <p className="text-3xl font-semibold text-gray-900">{metrics.upcomingSessions.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
              <Icon name="event" className="text-blue-600" />
            </div>
          </div>
        </Card>
        
        {/* Average Progress */}
        <Card className="p-6" hover={false}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Progreso medio</p>
              <p className="text-3xl font-semibold text-gray-900">{metrics.avgProgress}%</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center relative">
              <svg viewBox="0 0 36 36" className="w-9 h-9">
                <path 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" stroke="#fde68a" strokeWidth="3"
                />
                <path 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" stroke="#f59e0b" strokeWidth="3" 
                  strokeDasharray={`${metrics.avgProgress}, 100`}
                  strokeLinecap="round"
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
          <Card className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Facturación mensual</h3>
              <span className="text-sm text-gray-400">{new Date().getFullYear()}</span>
            </div>
            <div className="h-52 flex items-end gap-3">
              {monthlyRevenue.map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <div 
                      className="
                        w-full max-w-[40px] rounded-lg 
                        bg-gradient-to-t from-pv-pink to-pv-purple
                        transition-all duration-300 
                        group-hover:shadow-lg group-hover:shadow-pv-purple/20
                        cursor-pointer
                      " 
                      style={{ 
                        height: `${Math.max((value / maxRevenue) * 180, value > 0 ? 8 : 0)}px`
                      }} 
                    />
                    {/* Tooltip */}
                    <div className="
                      absolute -top-10 left-1/2 -translate-x-1/2
                      px-2 py-1 bg-gray-900 text-white text-xs rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity
                      pointer-events-none whitespace-nowrap
                    ">
                      {formatCurrency(value)}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-400">{months[i]}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects List */}
          <Card className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Proyectos</h3>
              <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {sortedProjects.length} total
              </span>
            </div>
            <div className="space-y-2">
              {sortedProjects.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => onSelectProject(p.id)} 
                  className="
                    flex items-center gap-4 p-4 rounded-xl 
                    hover:bg-gray-50 cursor-pointer 
                    transition-all duration-200
                    group
                  "
                >
                  {/* Avatar */}
                  <div className="
                    w-11 h-11 rounded-xl 
                    bg-gradient-to-br from-pv-pink to-pv-purple 
                    flex items-center justify-center 
                    text-white font-semibold text-sm
                    shadow-lg shadow-pv-purple/20
                  ">
                    {p.client?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{p.name}</div>
                    <div className="text-sm text-gray-500 truncate">{p.client}</div>
                  </div>
                  
                  {/* Revenue & Dates */}
                  <div className="text-right hidden md:block">
                    <div className="font-semibold text-gray-900">{formatCurrency(p.revenue.total)}</div>
                    <div className="text-xs text-gray-400">
                      {p.start ? `${formatDate(p.start)} - ${formatDate(p.end)}` : 'Sin fechas'}
                    </div>
                  </div>
                  
                  {/* Integration Icons */}
                  <div className="flex items-center gap-2">
                    {p.sharepoint && (
                      <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                        <window.SharePointIcon className="w-4 h-4 text-teal-600" />
                      </div>
                    )}
                    {p.teams && (
                      <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                        <window.TeamsIcon className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                    {p.planner && (
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                        <window.PlannerIcon className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <Icon 
                    name="chevron_right" 
                    className="text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" 
                  />
                </div>
              ))}
              {sortedProjects.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Icon name="folder_off" className="text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500">No hay proyectos</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card className="p-6" hover={false}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Icon name="event" className="text-blue-600 text-lg" />
              </div>
              <h3 className="font-semibold text-gray-900">Próximas sesiones</h3>
            </div>
            <div className="space-y-3">
              {metrics.upcomingSessions.map(s => (
                <div 
                  key={s.id} 
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="font-medium text-gray-900 text-sm mb-1">{s.title}</div>
                  <div className="text-xs text-gray-500 mb-2">{s.projectName}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Icon name="schedule" className="text-gray-400 text-sm" />
                      <span>{formatDate(s.date)} · {s.time}</span>
                    </div>
                    {s.type === 'online' && (
                      <Badge color="blue" size="sm">Online</Badge>
                    )}
                  </div>
                </div>
              ))}
              {metrics.upcomingSessions.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Icon name="event_available" className="text-2xl mb-2 block mx-auto opacity-50" />
                  No hay sesiones próximas
                </div>
              )}
            </div>
          </Card>

          {/* Urgent Tasks */}
          <Card className="p-6" hover={false}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Icon name="priority_high" className="text-red-500 text-lg" />
              </div>
              <h3 className="font-semibold text-gray-900">Tareas urgentes</h3>
            </div>
            <div className="space-y-3">
              {metrics.urgentTasks.map(t => (
                <div 
                  key={t.id} 
                  className="p-4 bg-red-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors cursor-pointer"
                >
                  <div className="font-medium text-gray-900 text-sm mb-1">{t.title}</div>
                  <div className="text-xs text-gray-500 mb-2">{t.projectName}</div>
                  {t.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600">
                      <Icon name="schedule" className="text-sm" />
                      <span>Vence: {formatDate(t.dueDate)}</span>
                    </div>
                  )}
                </div>
              ))}
              {metrics.urgentTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Icon name="check_circle" className="text-2xl mb-2 block mx-auto opacity-50" />
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
