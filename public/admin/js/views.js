// ============================================
// PLAIN VANILLA ADMIN - ROADMAP VIEWS
// Vistas: Timeline, Kanban, Calendar, Gantt
// ============================================

const { useState, useEffect, useRef } = React;

// Get components and utilities from window
const { Icon, Badge } = window;
const { 
  formatDate, getSessionStatus, getPhaseProgress,
  phaseColors, phaseTextColors 
} = window;

// ============================================
// TIMELINE VIEW
// ============================================

const TimelineView = ({ phases, sessions, tasks, onEditPhase, onEditSession }) => {
  const [expandedPhases, setExpandedPhases] = useState(new Set(phases.map(p => p.id)));
  
  const togglePhase = (id) => {
    const newSet = new Set(expandedPhases);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedPhases(newSet);
  };

  if (phases.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Icon name="timeline" className="text-5xl mb-3" />
        <div>No hay fases definidas</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {phases.map((phase, i) => {
        const phaseSessions = sessions.filter(s => s.phaseId === phase.id);
        const progress = getPhaseProgress(phase.id, sessions, tasks);
        const isExpanded = expandedPhases.has(phase.id);
        const bgColor = phaseColors[i % phaseColors.length];
        const textColor = phaseTextColors[i % phaseTextColors.length];
        
        return (
          <div key={phase.id} className={`${bgColor} rounded-xl overflow-hidden`}>
            {/* Phase Header */}
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer" 
              onClick={() => togglePhase(phase.id)}
            >
              <Icon 
                name={isExpanded ? 'expand_more' : 'chevron_right'} 
                className={textColor} 
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${textColor}`}>{phase.name}</span>
                  <Badge color={
                    phase.status === 'completed' ? 'green' : 
                    phase.status === 'active' ? 'amber' : 'gray'
                  }>
                    {phase.status === 'completed' ? 'Completado' : 
                     phase.status === 'active' ? 'En curso' : 'Pendiente'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {phase.startDate && phase.endDate 
                    ? `${formatDate(phase.startDate)} - ${formatDate(phase.endDate)}` 
                    : 'Sin fechas'}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Progress Bar */}
                <div className="w-24 h-2 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <span className="text-sm font-medium">{progress}%</span>
                
                <button 
                  onClick={e => { e.stopPropagation(); onEditPhase(phase); }} 
                  className="p-1 hover:bg-white/30 rounded"
                >
                  <Icon name="edit" className="text-sm" />
                </button>
              </div>
            </div>
            
            {/* Phase Sessions */}
            {isExpanded && phaseSessions.length > 0 && (
              <div className="px-4 pb-4 space-y-2">
                {phaseSessions
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(s => {
                    const status = getSessionStatus(s);
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => onEditSession(s)} 
                        className="bg-white/80 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-white transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          status === 'done' ? 'bg-green-100' : 
                          status === 'doing' ? 'bg-amber-100' : 'bg-gray-100'
                        }`}>
                          <Icon 
                            name={s.type === 'online' ? 'videocam' : 'place'} 
                            className={`text-sm ${
                              status === 'done' ? 'text-green-600' : 
                              status === 'doing' ? 'text-amber-600' : 'text-gray-400'
                            }`} 
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{s.title}</div>
                          <div className="text-xs text-gray-400">
                            {formatDate(s.date)} {s.time}
                          </div>
                        </div>
                        
                        {s.type === 'online' && s.teamsLink && (
                          <a 
                            href={s.teamsLink} 
                            target="_blank" 
                            rel="noopener" 
                            onClick={e => e.stopPropagation()} 
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <window.TeamsIcon className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// KANBAN VIEW
// ============================================

const KanbanView = ({ phases, sessions, tasks }) => {
  const columns = [
    { id: 'todo', title: 'Por hacer', icon: 'radio_button_unchecked', color: 'gray' },
    { id: 'doing', title: 'En curso', icon: 'pending', color: 'amber' },
    { id: 'done', title: 'Completado', icon: 'check_circle', color: 'green' }
  ];
  
  const getItemStatus = (item, type) => {
    if (type === 'session') {
      return getSessionStatus(item);
    }
    // Task
    if (item.status === 'completed') return 'done';
    if (item.status === 'in_progress') return 'doing';
    return 'todo';
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map(col => (
        <div key={col.id} className="bg-gray-50 rounded-xl p-3">
          <div className={`flex items-center gap-2 mb-3 text-${col.color}-600`}>
            <Icon name={col.icon} />
            <span className="font-medium">{col.title}</span>
          </div>
          
          <div className="space-y-2">
            {/* Sessions */}
            {sessions
              .filter(s => getItemStatus(s, 'session') === col.id)
              .map(s => (
                <div key={s.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon 
                      name={s.type === 'online' ? 'videocam' : 'place'} 
                      className="text-sm text-blue-500" 
                    />
                    <span className="text-xs text-blue-500 uppercase font-medium">SesiÃ³n</span>
                  </div>
                  <div className="font-medium text-gray-800 text-sm">{s.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(s.date)} {s.time}
                  </div>
                </div>
              ))}
            
            {/* Tasks */}
            {tasks
              .filter(t => getItemStatus(t, 'task') === col.id)
              .map(t => (
                <div key={t.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="task" className="text-sm text-purple-500" />
                    <span className="text-xs text-purple-500 uppercase font-medium">Tarea</span>
                    {t.priority === 'high' && <Badge color="red">!</Badge>}
                  </div>
                  <div className="font-medium text-gray-800 text-sm">{t.title}</div>
                  {t.dueDate && (
                    <div className="text-xs text-gray-400 mt-1">{formatDate(t.dueDate)}</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// CALENDAR VIEW
// ============================================

const CalendarView = ({ phases, sessions }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();
  
  const days = ['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b', 'Dom'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDayContent = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      phases: phases.filter(p => p.startDate && p.endDate && dateStr >= p.startDate && dateStr <= p.endDate),
      sessions: sessions.filter(s => s.date === dateStr)
    };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth(new Date(year, month - 1))} 
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Icon name="chevron_left" />
          </button>
          <span className="font-semibold text-gray-800">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={() => setCurrentMonth(new Date(year, month + 1))} 
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
        <button 
          onClick={() => setCurrentMonth(new Date())} 
          className="text-sm text-pv-purple hover:underline"
        >
          Hoy
        </button>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-2">
            {d}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for start offset */}
        {Array(startDay).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Days */}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const { phases: dayPhases, sessions: daySessions } = getDayContent(day);
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          
          return (
            <div 
              key={day} 
              className={`aspect-square p-1 rounded-lg ${
                isToday ? 'ring-2 ring-pv-purple' : ''
              } hover:bg-gray-50 cursor-pointer`}
            >
              <div className="text-xs text-gray-600 mb-1">{day}</div>
              <div className="space-y-0.5">
                {dayPhases.slice(0, 2).map((p, j) => (
                  <div 
                    key={p.id} 
                    className={`h-1 rounded-full ${phaseColors[phases.indexOf(p) % phaseColors.length]}`} 
                  />
                ))}
                {daySessions.length > 0 && (
                  <div className="flex gap-0.5">
                    {daySessions.slice(0, 3).map(s => (
                      <div 
                        key={s.id} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.type === 'online' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// GANTT VIEW
// ============================================

const GanttView = ({ phases, sessions }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  // Check if we have phases with dates
  const phasesWithDates = phases.filter(p => p.startDate && p.endDate);
  
  if (phasesWithDates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Icon name="bar_chart" className="text-5xl mb-3" />
        <div>No hay fases con fechas</div>
      </div>
    );
  }

  // Calculate date range
  const allDates = phasesWithDates.flatMap(p => [p.startDate, p.endDate]).sort();
  const startDate = new Date(allDates[0]);
  const endDate = new Date(allDates[allDates.length - 1]);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate dimensions
  const labelWidth = 150;
  const chartWidth = containerWidth - labelWidth - 40;
  const dayWidth = chartWidth / totalDays;
  
  // Today marker
  const today = new Date();
  const todayOffset = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

  const exportGantt = async () => {
    if (containerRef.current && window.html2canvas) {
      const canvas = await window.html2canvas(containerRef.current);
      const link = document.createElement('a');
      link.download = 'gantt-chart.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button 
          onClick={exportGantt}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <Icon name="download" className="text-sm" />
          Exportar PNG
        </button>
      </div>
      
      <div ref={containerRef} className="overflow-hidden bg-white p-4 rounded-lg">
        {/* Header */}
        <div className="flex border-b border-gray-200 pb-2 mb-4">
          <div style={{ width: labelWidth }} className="text-sm font-medium text-gray-500">
            Fase
          </div>
          <div className="flex-1 flex justify-between text-xs text-gray-400">
            <span>{formatDate(allDates[0])}</span>
            <span>{formatDate(allDates[allDates.length - 1])}</span>
          </div>
        </div>
        
        {/* Bars */}
        <div className="space-y-3 relative">
          {/* Today line */}
          {todayOffset >= 0 && todayOffset <= totalDays && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" 
              style={{ left: labelWidth + (todayOffset * dayWidth) }} 
            />
          )}
          
          {phasesWithDates.map((phase, i) => {
            const phaseStart = new Date(phase.startDate);
            const phaseEnd = new Date(phase.endDate);
            const offset = Math.ceil((phaseStart - startDate) / (1000 * 60 * 60 * 24));
            const duration = Math.ceil((phaseEnd - phaseStart) / (1000 * 60 * 60 * 24)) + 1;
            const width = duration * dayWidth;
            const left = offset * dayWidth;
            const bgColor = phaseColors[i % phaseColors.length];
            const textColor = phaseTextColors[i % phaseTextColors.length];
            
            return (
              <div key={phase.id} className="flex items-center">
                <div 
                  style={{ width: labelWidth }} 
                  className="text-sm text-gray-700 truncate pr-4"
                >
                  {phase.name}
                </div>
                <div className="flex-1 relative h-8">
                  <div 
                    className={`absolute h-full rounded-lg ${bgColor} flex items-center px-2`} 
                    style={{ left, width: Math.max(width, 20) }}
                  >
                    <span className={`text-xs font-medium ${textColor} truncate`}>
                      {getPhaseProgress(phase.id, sessions, [])}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Export to window
window.TimelineView = TimelineView;
window.KanbanView = KanbanView;
window.CalendarView = CalendarView;
window.GanttView = GanttView;
