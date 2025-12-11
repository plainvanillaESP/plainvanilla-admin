// ============================================
// PLAIN VANILLA - DASHBOARD
// Apple-style: minimal, clean, elegant
// ============================================

const { useState, useMemo } = React;
const { Icon, Card, Badge } = window;
const { formatDate, formatCurrency, getProjectDates, calculateProjectRevenue, getSessionStatus, getPhaseProgress } = window;

// ============================================
// DASHBOARD VIEW
// ============================================

const DashboardView = ({ projects, onSelectProject }) => {
  const [dateRange, setDateRange] = useState('all');
  
  const projectsWithData = useMemo(() => {
    return projects.map(p => ({
      ...p,
      ...getProjectDates(p),
      revenue: calculateProjectRevenue(p)
    }));
  }, [projects]);
  
  const filteredProjects = useMemo(() => {
    return projectsWithData.filter(p => {
      if (dateRange === 'all') return true;
      if (!p.start) return false;
      
      const now = new Date();
      const startDate = new Date(p.start);
      
      if (dateRange === 'month') {
        return startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear();
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
  
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (!a.start && !b.start) return 0;
      if (!a.start) return 1;
      if (!b.start) return -1;
      return new Date(a.start) - new Date(b.start);
    });
  }, [filteredProjects]);
  
  const metrics = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.revenue.total, 0);
    
    const allSessions = projects.flatMap(p => 
      (p.sessions || []).map(s => ({ ...s, projectName: p.name, projectId: p.id }))
    );
    const upcomingSessions = allSessions
      .filter(s => s.date && new Date(s.date + 'T' + (s.time || '00:00')) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
    
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
    
    const urgentTasks = projects.flatMap(p => 
      (p.tasks || [])
        .filter(t => t.priority === 'high' && t.status !== 'completed')
        .map(t => ({ ...t, projectName: p.name }))
    ).slice(0, 5);
    
    return { activeProjects, totalRevenue, upcomingSessions, avgProgress, urgentTasks };
  }, [projects, filteredProjects]);
  
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
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-apple-gray-600 tracking-tight">Dashboard</h1>
          <p className="text-sm text-apple-gray-400 mt-0.5">Vista general</p>
        </div>
        <select 
          value={dateRange} 
          onChange={e => setDateRange(e.target.value)} 
          className="px-3 py-2 text-sm bg-white border border-apple-gray-200 rounded-lg text-apple-gray-600 focus:outline-none focus:border-apple-blue"
        >
          <option value="all">Todo</option>
          <option value="month">Este mes</option>
          <option value="quarter">Trimestre</option>
          <option value="year">Este año</option>
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <Card>
          <p className="text-sm text-apple-gray-400 uppercase tracking-wide mb-1">Proyectos activos</p>
          <p className="text-2xl font-semibold text-apple-gray-600">{metrics.activeProjects}</p>
        </Card>
        
        <Card>
          <p className="text-sm text-apple-gray-400 uppercase tracking-wide mb-1">Facturación</p>
          <p className="text-2xl font-semibold text-apple-gray-600">{formatCurrency(metrics.totalRevenue)}</p>
        </Card>
        
        <Card>
          <p className="text-sm text-apple-gray-400 uppercase tracking-wide mb-1">Próximas sesiones</p>
          <p className="text-2xl font-semibold text-apple-gray-600">{metrics.upcomingSessions.length}</p>
        </Card>
        
        <Card>
          <p className="text-sm text-apple-gray-400 uppercase tracking-wide mb-1">Progreso medio</p>
          <p className="text-2xl font-semibold text-apple-gray-600">{metrics.avgProgress}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          {/* Revenue Chart */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-apple-gray-600">Facturación mensual</h3>
              <span className="text-sm text-apple-gray-400">{new Date().getFullYear()}</span>
            </div>
            <div className="h-44 flex items-end gap-2">
              {monthlyRevenue.map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <div 
                      className="w-full max-w-[28px] rounded pv-gradient transition-all group-hover:opacity-80 cursor-pointer" 
                      style={{ height: `${Math.max((value / maxRevenue) * 140, value > 0 ? 4 : 0)}px` }} 
                      title={formatCurrency(value)}
                    />
                  </div>
                  <span className="text-sm text-apple-gray-400">{months[i]}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects List */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-apple-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-apple-gray-600">Proyectos</h3>
              <span className="text-sm text-apple-gray-400">{sortedProjects.length}</span>
            </div>
            <div className="divide-y divide-apple-gray-100">
              {sortedProjects.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => onSelectProject(p.id)} 
                  className="flex items-center gap-4 px-6 py-4 hover:bg-apple-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg pv-gradient flex items-center justify-center text-white text-sm font-medium">
                    {p.client?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-apple-gray-600 truncate">{p.name}</p>
                    <p className="text-sm text-apple-gray-400 truncate">{p.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-apple-gray-600">{formatCurrency(p.revenue.total)}</p>
                    <p className="text-sm text-apple-gray-400">
                      {p.start ? formatDate(p.start) : 'Sin fechas'}
                    </p>
                  </div>
                  <Icon name="chevron_right" className="text-apple-gray-300 text-lg" />
                </div>
              ))}
              {sortedProjects.length === 0 && (
                <div className="py-12 text-center text-sm text-apple-gray-400">
                  No hay proyectos
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-apple-gray-100">
              <h3 className="text-sm font-medium text-apple-gray-600">Próximas sesiones</h3>
            </div>
            <div className="p-4 space-y-3">
              {metrics.upcomingSessions.map(s => (
                <div key={s.id} className="p-3 bg-apple-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-apple-gray-600">{s.title}</p>
                  <p className="text-sm text-apple-gray-400 mt-0.5">{s.projectName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-apple-gray-500">
                      {formatDate(s.date)} · {s.time}
                    </span>
                    {s.type === 'online' && <Badge color="blue">Online</Badge>}
                  </div>
                </div>
              ))}
              {metrics.upcomingSessions.length === 0 && (
                <p className="py-6 text-center text-sm text-apple-gray-400">
                  No hay sesiones próximas
                </p>
              )}
            </div>
          </Card>

          {/* Urgent Tasks */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-apple-gray-100">
              <h3 className="text-sm font-medium text-apple-gray-600">Tareas urgentes</h3>
            </div>
            <div className="p-4 space-y-3">
              {metrics.urgentTasks.map(t => (
                <div key={t.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm font-medium text-apple-gray-600">{t.title}</p>
                  <p className="text-sm text-apple-gray-400 mt-0.5">{t.projectName}</p>
                  {t.dueDate && (
                    <p className="text-sm text-apple-red mt-1">Vence: {formatDate(t.dueDate)}</p>
                  )}
                </div>
              ))}
              {metrics.urgentTasks.length === 0 && (
                <p className="py-6 text-center text-sm text-apple-gray-400">
                  No hay tareas urgentes
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

window.DashboardView = DashboardView;
