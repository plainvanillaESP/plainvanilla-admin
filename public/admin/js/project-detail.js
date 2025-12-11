// ============================================
// PLAIN VANILLA ADMIN - PROJECT DETAIL
// Diseño Apple-style: limpio, elegante, minimalista
// ============================================

const { useState, useEffect } = React;

// Get components and utilities from window
const { Icon, Card, Button, Badge, Spinner, EmptyState } = window;
const { 
  api, formatDate, formatCurrency, calculateProjectRevenue, 
  getPhaseProgress, useToast 
} = window;

// ============================================
// PROJECT DETAIL VIEW
// ============================================

const ProjectDetailView = ({ projectId, onBack, onRefresh }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [taskFilter, setTaskFilter] = useState('all');
  
  // Modal states
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showClientAccessModal, setShowClientAccessModal] = useState(false);
  const [showM365Modal, setShowM365Modal] = useState(false);
  
  // Editing states
  const [editingPhase, setEditingPhase] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  
  const toast = useToast();

  const loadProject = async () => {
    try {
      const data = await api.get(`/api/projects/${projectId}`);
      setProject(data);
    } catch (e) {
      toast.error('Error al cargar proyecto');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="folder_off" className="text-3xl text-gray-400" />
        </div>
        <p className="text-gray-500">Proyecto no encontrado</p>
      </div>
    );
  }

  const phases = (project.phases || []).sort((a, b) => a.order - b.order);
  const sessions = project.sessions || [];
  const tasks = project.tasks || [];
  const revenue = calculateProjectRevenue(project);

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return t.status === 'pending';
    if (taskFilter === 'in_progress') return t.status === 'in_progress';
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'public') return t.visibility === 'public';
    if (taskFilter === 'internal') return t.visibility === 'internal';
    return true;
  });

  // Get view component based on active tab
  const ViewComponent = {
    timeline: window.TimelineView,
    kanban: window.KanbanView,
    calendar: window.CalendarView,
    gantt: window.GanttView
  }[activeTab];

  const tabs = [
    { id: 'timeline', icon: 'timeline', label: 'Timeline' },
    { id: 'kanban', icon: 'view_kanban', label: 'Kanban' },
    { id: 'calendar', icon: 'calendar_month', label: 'Calendario' },
    { id: 'gantt', icon: 'bar_chart', label: 'Gantt' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack} 
          className="
            p-2.5 rounded-xl
            text-gray-500 hover:text-gray-700
            hover:bg-gray-100
            transition-all duration-200
          "
        >
          <Icon name="arrow_back" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{project.name}</h1>
            <Badge color={project.status === 'active' ? 'green' : 'gray'} size="md">
              {project.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-gray-500 mt-0.5">{project.client}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* M365 Links */}
          {project.sharepoint && (
            <a 
              href={project.sharepoint.folderUrl} 
              target="_blank" 
              rel="noopener" 
              className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors" 
              title="SharePoint"
            >
              <window.SharePointIcon className="w-5 h-5 text-teal-600" />
            </a>
          )}
          {project.teams && (
            <a 
              href={project.teams.channelUrl} 
              target="_blank" 
              rel="noopener" 
              className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors" 
              title="Teams"
            >
              <window.TeamsIcon className="w-5 h-5 text-purple-600" />
            </a>
          )}
          {project.planner && (
            <a 
              href="https://tasks.office.com/" 
              target="_blank" 
              rel="noopener" 
              className="p-2.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors" 
              title="Planner"
            >
              <window.PlannerIcon className="w-5 h-5 text-green-600" />
            </a>
          )}
          
          <div className="w-px h-8 bg-gray-200 mx-2" />
          
          <Button variant="outline" size="md" onClick={() => setShowM365Modal(true)} icon="settings">
            Microsoft 365
          </Button>
          
          <Button variant="soft" size="md" onClick={() => setShowClientAccessModal(true)} icon="person_add">
            Acceso cliente
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Roadmap & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roadmap Card */}
          <Card className="overflow-hidden" hover={false}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pv-pink/10 to-pv-purple/10 flex items-center justify-center">
                  <Icon name="route" className="text-pv-purple text-lg" />
                </div>
                <h2 className="font-semibold text-gray-900">Roadmap</h2>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {tabs.map(tab => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id)} 
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${activeTab === tab.id 
                          ? 'bg-white shadow-sm text-gray-900' 
                          : 'text-gray-500 hover:text-gray-700'
                        }
                      `}
                    >
                      <Icon 
                        name={tab.icon} 
                        className={`text-base ${activeTab === tab.id ? 'text-pv-purple' : ''}`} 
                      />
                    </button>
                  ))}
                </div>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => { setEditingPhase(null); setShowPhaseModal(true); }}
                  icon="add"
                >
                  Fase
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => { setEditingSession(null); setShowSessionModal(true); }}
                  icon="add"
                >
                  Sesión
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              {ViewComponent && (
                <ViewComponent 
                  phases={phases} 
                  sessions={sessions} 
                  tasks={tasks}
                  onEditPhase={p => { setEditingPhase(p); setShowPhaseModal(true); }}
                  onEditSession={s => { setEditingSession(s); setShowSessionModal(true); }}
                />
              )}
            </div>
          </Card>

          {/* Tasks Card */}
          <Card hover={false}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pv-pink/10 to-pv-purple/10 flex items-center justify-center">
                  <Icon name="task_alt" className="text-pv-purple text-lg" />
                </div>
                <h2 className="font-semibold text-gray-900">Tareas</h2>
                <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={taskFilter} 
                  onChange={e => setTaskFilter(e.target.value)} 
                  className="
                    text-sm px-3 py-2 
                    bg-gray-50 border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-4 focus:ring-pv-purple/10 focus:border-pv-purple
                    appearance-none cursor-pointer
                    bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2224%22%20height%3d%2224%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]
                    bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8
                  "
                >
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Completadas</option>
                  <option value="public">Públicas</option>
                  <option value="internal">Internas</option>
                </select>
                
                <Button 
                  size="sm" 
                  onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
                  icon="add"
                >
                  Tarea
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-1">
                {filteredTasks.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => { setEditingTask(t); setShowTaskModal(true); }} 
                    className="
                      flex items-center gap-4 p-4 rounded-xl 
                      hover:bg-gray-50 cursor-pointer 
                      transition-all duration-200
                      group
                    "
                  >
                    {/* Status indicator */}
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      transition-colors
                      ${t.status === 'completed' 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : t.status === 'in_progress' 
                          ? 'border-amber-400 bg-amber-50' 
                          : 'border-gray-300 bg-white'
                      }
                    `}>
                      {t.status === 'completed' && (
                        <Icon name="check" className="text-white text-xs" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${
                        t.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}>
                        {t.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {t.dueDate && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Icon name="schedule" className="text-xs" />
                            {formatDate(t.dueDate)}
                          </span>
                        )}
                        <Badge color={t.visibility === 'public' ? 'blue' : 'gray'} size="sm">
                          {t.visibility === 'public' ? 'Público' : 'Interno'}
                        </Badge>
                        {t.assignedToType === 'client' && (
                          <Badge color="purple" size="sm">Cliente</Badge>
                        )}
                        {t.priority === 'high' && (
                          <Badge color="red" size="sm">Urgente</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <Icon 
                      name="chevron_right" 
                      className="text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" 
                    />
                  </div>
                ))}
              </div>
              
              {filteredTasks.length === 0 && (
                <div className="py-8">
                  <EmptyState
                    icon="task"
                    title="No hay tareas"
                    description={taskFilter !== 'all' ? 'Prueba con otro filtro' : 'Añade tu primera tarea'}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Budget & Details */}
        <div className="space-y-6">
          {/* Budget Card */}
          <BudgetCard project={project} onSave={loadProject} />
          
          {/* Details Card */}
          <Card className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon name="info" className="text-gray-500 text-lg" />
              </div>
              <h3 className="font-semibold text-gray-900">Detalles</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Estado</span>
                <Badge color={project.status === 'active' ? 'green' : 'gray'}>
                  {project.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Fases</span>
                <span className="text-sm font-semibold text-gray-900">{phases.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Sesiones</span>
                <span className="text-sm font-semibold text-gray-900">{sessions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tareas</span>
                <span className="text-sm font-semibold text-gray-900">{tasks.length}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Creado</span>
                  <span className="text-sm text-gray-900">{formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {window.PhaseModal && (
        <window.PhaseModal 
          isOpen={showPhaseModal} 
          onClose={() => setShowPhaseModal(false)} 
          phase={editingPhase} 
          projectId={projectId} 
          phases={phases} 
          onSave={loadProject} 
        />
      )}
      
      {window.SessionModal && (
        <window.SessionModal 
          isOpen={showSessionModal} 
          onClose={() => setShowSessionModal(false)} 
          session={editingSession} 
          projectId={projectId} 
          phases={phases} 
          onSave={loadProject} 
        />
      )}
      
      {window.TaskModal && (
        <window.TaskModal 
          isOpen={showTaskModal} 
          onClose={() => setShowTaskModal(false)} 
          task={editingTask} 
          projectId={projectId} 
          phases={phases} 
          onSave={loadProject} 
        />
      )}
      
      {window.ClientAccessModal && (
        <window.ClientAccessModal 
          isOpen={showClientAccessModal} 
          onClose={() => setShowClientAccessModal(false)} 
          project={project} 
          onSave={loadProject} 
        />
      )}
      
      {window.M365SetupModal && (
        <window.M365SetupModal 
          isOpen={showM365Modal} 
          onClose={() => setShowM365Modal(false)} 
          project={project} 
          onSave={loadProject} 
        />
      )}
    </div>
  );
};

// ============================================
// BUDGET CARD - Apple Style
// ============================================

const BudgetCard = ({ project, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [pricing, setPricing] = useState(project.pricing || { basePrice: 0, vatExempt: false, vatRate: 21 });
  const [addOns, setAddOns] = useState(project.addOns || []);
  const [newAddOn, setNewAddOn] = useState({ name: '', price: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const revenue = calculateProjectRevenue({ pricing, addOns });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/projects/${project.id}`, { pricing, addOns });
      toast.success('Presupuesto actualizado');
      setEditing(false);
      onSave();
    } catch (e) {
      toast.error('Error al guardar');
    }
    setSaving(false);
  };

  const addAddOnItem = () => {
    if (!newAddOn.name || !newAddOn.price) return;
    setAddOns([...addOns, { 
      id: Date.now().toString(), 
      name: newAddOn.name, 
      price: parseFloat(newAddOn.price) 
    }]);
    setNewAddOn({ name: '', price: '' });
  };

  const removeAddOn = (id) => {
    setAddOns(addOns.filter(a => a.id !== id));
  };

  return (
    <Card className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Icon name="euro" className="text-emerald-600 text-lg" />
          </div>
          <h3 className="font-semibold text-gray-900">Presupuesto</h3>
        </div>
        <button 
          onClick={() => setEditing(!editing)} 
          className="text-sm font-medium text-pv-purple hover:text-pv-pink transition-colors"
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-5">
          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Precio base (sin IVA)</label>
            <div className="relative">
              <input 
                type="number" 
                value={pricing.basePrice} 
                onChange={e => setPricing({ ...pricing, basePrice: parseFloat(e.target.value) || 0 })} 
                className="
                  w-full px-4 py-2.5 pr-10
                  bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:bg-white focus:border-pv-purple focus:ring-4 focus:ring-pv-purple/10
                  transition-all
                " 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
          </div>
          
          {/* VAT Exempt */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={pricing.vatExempt} 
                onChange={e => setPricing({ ...pricing, vatExempt: e.target.checked })} 
                className="sr-only peer"
              />
              <div className="
                w-5 h-5 rounded-md border-2 border-gray-300
                peer-checked:bg-pv-purple peer-checked:border-pv-purple
                transition-all
                flex items-center justify-center
              ">
                {pricing.vatExempt && <Icon name="check" className="text-white text-xs" />}
              </div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Exento de IVA</span>
          </label>
          
          {/* Add-ons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
            <div className="space-y-2">
              {addOns.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">{a.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(a.price)}</span>
                    <button 
                      onClick={() => removeAddOn(a.id)} 
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Icon name="close" className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-3">
              <input 
                type="text" 
                placeholder="Nombre del add-on" 
                value={newAddOn.name} 
                onChange={e => setNewAddOn({ ...newAddOn, name: e.target.value })} 
                className="
                  flex-1 px-3 py-2 text-sm 
                  bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:bg-white focus:border-pv-purple
                  transition-all
                " 
              />
              <input 
                type="number" 
                placeholder="€" 
                value={newAddOn.price} 
                onChange={e => setNewAddOn({ ...newAddOn, price: e.target.value })} 
                className="
                  w-24 px-3 py-2 text-sm text-right
                  bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:bg-white focus:border-pv-purple
                  transition-all
                " 
              />
              <button 
                onClick={addAddOnItem} 
                className="
                  px-3 py-2 
                  bg-gray-100 hover:bg-gray-200 
                  rounded-xl transition-colors
                "
              >
                <Icon name="add" className="text-gray-600" />
              </button>
            </div>
          </div>
          
          <Button onClick={handleSave} loading={saving} className="w-full">
            Guardar cambios
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Base</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(pricing.basePrice)}</span>
          </div>
          
          {addOns.map(a => (
            <div key={a.id} className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{a.name}</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(a.price)}</span>
            </div>
          ))}
          
          <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm text-gray-700">{formatCurrency(revenue.subtotal)}</span>
            </div>
            
            {!pricing.vatExempt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">IVA ({pricing.vatRate}%)</span>
                <span className="text-sm text-gray-700">{formatCurrency(revenue.vatAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold gradient-text">{formatCurrency(revenue.total)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// Export to window
window.ProjectDetailView = ProjectDetailView;
window.BudgetCard = BudgetCard;
