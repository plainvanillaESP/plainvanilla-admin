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

const TimelineView = ({ phases, sessions, tasks, onEditPhase, onEditSession, onDeleteSession, onReorderPhases, onMoveSession, onMoveTask, onEditTask }) => {
  const [expandedPhases, setExpandedPhases] = useState(new Set(phases.map(p => p.id)));
  const phasesContainerRef = useRef(null);
  
  // Drag and drop para fases
  useEffect(() => {
    if (phasesContainerRef.current && window.Sortable && onReorderPhases) {
      const sortable = new window.Sortable(phasesContainerRef.current, {
        animation: 150,
        handle: '.phase-drag-handle',
        ghostClass: 'opacity-50',
        onEnd: (evt) => {
          const newOrder = Array.from(phasesContainerRef.current.children).map(
            (el, index) => ({ id: el.dataset.phaseId, order: index })
          );
          onReorderPhases(newOrder);
        }
      });
      return () => sortable.destroy();
    }
  }, [phases, onReorderPhases]);

  // Drag and drop para sesiones y tareas dentro de fases
  useEffect(() => {
    if (!window.Sortable || !onMoveSession) return;
    
    const containers = document.querySelectorAll('.phase-items-container');
    const sortables = [];
    
    containers.forEach(container => {
      const sortable = new window.Sortable(container, {
        animation: 150,
        group: { name: 'phase-items', pull: true, put: true },
        handle: '.item-drag-handle',
        ghostClass: 'opacity-50',
        onEnd: (evt) => {
          const itemId = evt.item.dataset.itemId;
          const itemType = evt.item.dataset.itemType;
          const newPhaseId = evt.to.dataset.phaseId;
          const oldPhaseId = evt.from.dataset.phaseId;
          const newIndex = evt.newIndex;
          
          // Si cambió de fase, revertir el movimiento DOM y dejar que React lo haga
          if (oldPhaseId !== newPhaseId) {
            evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex] || null);
          }
          
          if (itemType === 'session' && onMoveSession) {
            onMoveSession(itemId, newPhaseId, newIndex);
          } else if (itemType === 'task' && onMoveTask) {
            onMoveTask(itemId, newPhaseId, newIndex);
          }
        }
      });
      sortables.push(sortable);
    });
    
    return () => sortables.forEach(s => s.destroy());
  }, [phases, sessions, tasks, expandedPhases, onMoveSession, onMoveTask]);
  
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
      <div className="text-center py-12 text-apple-gray-400">
        <Icon name="timeline" className="text-5xl mb-3" />
        <div>No hay fases definidas</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={phasesContainerRef}>
      {phases.map((phase, i) => {
        const phaseSessions = sessions.filter(s => s.phaseId === phase.id);
        const phaseTasks = tasks.filter(t => t.phaseId === phase.id);
        const progress = getPhaseProgress(phase.id, sessions, tasks);
        const isExpanded = expandedPhases.has(phase.id);
        const bgColor = phaseColors[i % phaseColors.length];
        const textColor = phaseTextColors[i % phaseTextColors.length];
        
        return (
          <div key={phase.id} data-phase-id={phase.id} className={`${bgColor} rounded-xl overflow-hidden`}>
            {/* Phase Header */}
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer" 
              onClick={() => togglePhase(phase.id)}
            >
              <div className="phase-drag-handle cursor-grab hover:cursor-grabbing p-1 -ml-2 text-gray-400 hover:text-gray-600">
                <Icon name="drag_indicator" className="text-lg" />
              </div>
              <Icon 
                name={isExpanded ? 'expand_more' : 'chevron_right'} 
                className={textColor} 
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${textColor}`}>{i + 1}. {phase.name}</span>
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
            
            {/* Phase Content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-2 phase-items-container" data-phase-id={phase.id}>
                {/* Sessions */}
                {phaseSessions
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(s => {
                    const status = getSessionStatus(s);
                    const teamsUrl = s.teamsMeetingUrl || s.teamsLink || s.teams_meeting_url;
                    return (
                      <div 
                        key={s.id}
                        data-item-id={s.id}
                        data-item-type="session"
                        onClick={() => onEditSession(s)} 
                        className="bg-white/80 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-white transition-colors"
                      >
                        <div className="item-drag-handle cursor-grab hover:cursor-grabbing text-gray-300 hover:text-gray-500 -ml-1" onClick={e => e.stopPropagation()}>
                          <Icon name="drag_indicator" className="text-base" />
                        </div>
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
                          <div className="font-medium text-apple-gray-600">{s.title}</div>
                          <div className="text-sm text-apple-gray-400">
                            {formatDate(s.date)} {s.time}
                          </div>
                        </div>
                        
                        {s.type === 'online' && teamsUrl && (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <a 
                              href={teamsUrl} 
                              target="_blank" 
                              rel="noopener"
                              className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              Unirse
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(teamsUrl);
                                if (window.toast) window.toast.success('Link copiado al portapapeles');
                              }}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Copiar link"
                            >
                              <Icon name="content_copy" className="text-sm" />
                            </button>
                            <button
                              onClick={() => onDeleteSession && onDeleteSession(s)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar sesión"
                            >
                              <Icon name="delete" className="text-sm" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                
                {/* Tasks */}
                {phaseTasks.map(t => {
                  
                  return (
                  <div 
                    key={t.id}
                    data-item-id={t.id}
                    data-item-type="task"
                    onClick={() => onEditTask && onEditTask(t)}
                    className="bg-white/80 rounded-lg p-3 flex items-center gap-3 border-l-4 border-blue-400 cursor-pointer hover:bg-white transition-colors"
                  >
                    <div className="item-drag-handle cursor-grab hover:cursor-grabbing text-gray-300 hover:text-gray-500 -ml-1" onClick={e => e.stopPropagation()}>
                      <Icon name="drag_indicator" className="text-base" />
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      t.status === 'completed' ? 'bg-blue-100' : 
                      t.status === 'in_progress' ? 'bg-orange-100' : 'bg-slate-100'
                    }`}>
                      <Icon 
                        name={t.status === 'completed' ? 'check_box' : 'check_box_outline_blank'}
                        className={`text-sm ${
                          t.status === 'completed' ? 'text-blue-600' : 
                          t.status === 'in_progress' ? 'text-orange-600' : 'text-slate-400'
                        }`} 
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className={`font-medium ${t.status === 'completed' ? 'text-apple-gray-400 line-through' : 'text-apple-gray-600'}`}>
                        {t.title}
                      </div>
                      {t.dueDate && (
                        <div className="text-sm text-apple-gray-400">
                          Vence: {formatDate(t.dueDate)}
                        </div>
                      )}
                    </div>
                    
                    {t.assignedTo && t.assignedTo.length > 0 && (
                      <div className="flex -space-x-2">
                        {t.assignedTo.slice(0, 3).map((person, idx) => {
                          const personInitials = person.name ? person.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '?';
                          return (
                            <div 
                              key={idx}
                              className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium overflow-hidden"
                              title={person.name || person.email}
                              style={{ zIndex: 10 - idx }}
                            >
                              {person.photo ? (
                                <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                              ) : personInitials}
                            </div>
                          );
                        })}
                        {t.assignedTo.length > 3 && (
                          <div 
                            className="w-7 h-7 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-xs font-medium"
                            style={{ zIndex: 6 }}
                          >
                            +{t.assignedTo.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {t.priority === 'high' && (
                      <Badge color="red">Urgente</Badge>
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
    if (item.status === 'completed') return 'done';
    if (item.status === 'in_progress') return 'doing';
    return 'todo';
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map(col => (
        <div key={col.id} className="bg-apple-gray-50 rounded-xl p-3">
          <div className={`flex items-center gap-2 mb-3 text-${col.color}-600`}>
            <Icon name={col.icon} />
            <span className="font-medium">{col.title}</span>
          </div>
          
          <div className="space-y-2">
            {/* Sessions */}
            {sessions
              .filter(s => getItemStatus(s, 'session') === col.id)
              .map(s => {
                const teamsUrl = s.teamsMeetingUrl || s.teamsLink || s.teams_meeting_url;
                return (
                  <div key={s.id} className="bg-white p-3 rounded-lg shadow-sm border border-apple-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon 
                        name={s.type === 'online' ? 'videocam' : 'place'} 
                        className="text-sm text-blue-500" 
                      />
                      <span className="text-sm text-blue-500 uppercase font-medium">Sesion</span>
                    </div>
                    <div className="font-medium text-apple-gray-600 text-sm">{s.title}</div>
                    <div className="text-sm text-apple-gray-400 mt-1">
                      {formatDate(s.date)} {s.time}
                    </div>
                    {s.type === 'online' && teamsUrl && (
                      <a 
                        href={teamsUrl} 
                        target="_blank" 
                        rel="noopener" 
                        className="mt-2 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                      >
                        
                        Unirse a Teams
                      </a>
                    )}
                  </div>
                );
              })}
            
            {/* Tasks */}
            {tasks
              .filter(t => getItemStatus(t, 'task') === col.id)
              .map(t => (
                <div key={t.id} className="bg-white p-3 rounded-lg shadow-sm border border-apple-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="task" className="text-sm text-purple-500" />
                    <span className="text-sm text-purple-500 uppercase font-medium">Tarea</span>
                    {t.priority === 'high' && <Badge color="red">!</Badge>}
                  </div>
                  <div className="font-medium text-apple-gray-600 text-sm">{t.title}</div>
                  {t.dueDate && (
                    <div className="text-sm text-apple-gray-400 mt-1">
                      {formatDate(t.dueDate)}
                    </div>
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getDayContent = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayPhases = phases.filter(p => 
      p.startDate && p.endDate && dateStr >= p.startDate && dateStr <= p.endDate
    );
    
    const daySessions = sessions.filter(s => s.date === dateStr);
    
    return { phases: dayPhases, sessions: daySessions };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentMonth(new Date(year, month - 1))} 
            className="p-1 hover:bg-apple-gray-100 rounded"
          >
            <Icon name="chevron_left" />
          </button>
          <span className="font-semibold text-apple-gray-600">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={() => setCurrentMonth(new Date(year, month + 1))} 
            className="p-1 hover:bg-apple-gray-100 rounded"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
        <button 
          onClick={() => setCurrentMonth(new Date())} 
          className="text-sm text-apple-blue hover:underline"
        >
          Hoy
        </button>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(d => (
          <div key={d} className="text-center text-sm text-apple-gray-400 font-medium py-2">
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
              } hover:bg-apple-gray-50 cursor-pointer`}
            >
              <div className="text-sm text-apple-gray-600 mb-1">{day}</div>
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

  const phasesWithDates = phases.filter(p => p.startDate && p.endDate);
  
  if (phasesWithDates.length === 0) {
    return (
      <div className="text-center py-12 text-apple-gray-400">
        <Icon name="bar_chart" className="text-5xl mb-3" />
        <div>No hay fases con fechas</div>
      </div>
    );
  }

  const allDates = phasesWithDates.flatMap(p => [p.startDate, p.endDate]).sort();
  const startDate = new Date(allDates[0]);
  const endDate = new Date(allDates[allDates.length - 1]);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  const labelWidth = 150;
  const chartWidth = containerWidth - labelWidth - 40;
  const dayWidth = chartWidth / totalDays;
  
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
          className="flex items-center gap-1 text-sm text-apple-gray-500 hover:text-apple-gray-700"
        >
          <Icon name="download" className="text-sm" />
          Exportar PNG
        </button>
      </div>
      
      <div ref={containerRef} className="overflow-hidden bg-white p-4 rounded-lg">
        {/* Header */}
        <div className="flex border-b border-apple-gray-200 pb-2 mb-4">
          <div style={{ width: labelWidth }} className="text-sm font-medium text-apple-gray-500">
            Fase
          </div>
          <div className="flex-1 flex justify-between text-sm text-apple-gray-400">
            <span>{formatDate(allDates[0])}</span>
            <span>{formatDate(allDates[allDates.length - 1])}</span>
          </div>
        </div>
        
        {/* Bars */}
        <div className="space-y-3 relative">
          {/* Today line */}
          {todayOffset >= 0 && todayOffset <= totalDays && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-apple-red z-10" 
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
                  className="text-sm text-apple-gray-600 truncate pr-4"
                >
                  {phase.name}
                </div>
                <div className="flex-1 relative h-8">
                  <div 
                    className={`absolute h-full rounded-lg ${bgColor} flex items-center px-2`} 
                    style={{ left, width: Math.max(width, 20) }}
                  >
                    <span className={`text-sm font-medium ${textColor} truncate`}>
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
