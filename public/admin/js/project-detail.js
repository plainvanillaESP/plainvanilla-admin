// ============================================
// PLAIN VANILLA - PROJECT DETAIL
// Apple-style: minimal, clean, elegant
// ============================================

const { useState, useEffect } = React;
const { Icon, Card, Button, Badge, Spinner, EmptyState } = window;
const { api, formatDate, formatCurrency, calculateProjectRevenue, getPhaseProgress, useToast } = window;

// ============================================
// PROJECT DETAIL VIEW
// ============================================

const ProjectDetailView = ({ projectId, onBack, onRefresh }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [taskFilter, setTaskFilter] = useState('all');
  
  // Modals
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showClientAccessModal, setShowClientAccessModal] = useState(false);
  const [showM365Modal, setShowM365Modal] = useState(false);
  
  // Editing
  const [editingPhase, setEditingPhase] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  
  const toast = useToast();

  const loadProject = async () => {
    try {
      const data = await api.get(`/api/projects/${projectId}`);
      setProject(data);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  useEffect(() => { loadProject(); }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-apple-gray-400">
        Proyecto no encontrado
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

  const ViewComponent = {
    timeline: window.TimelineView,
    kanban: window.KanbanView,
    calendar: window.CalendarView,
    gantt: window.GanttView
  }[activeTab];

  const tabs = [
    { id: 'timeline', icon: 'timeline' },
    { id: 'kanban', icon: 'view_kanban' },
    { id: 'calendar', icon: 'calendar_month' },
    { id: 'gantt', icon: 'bar_chart' }
  ];

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 text-apple-gray-400 hover:text-apple-gray-600 hover:bg-apple-gray-100 rounded-lg transition-colors">
          <Icon name="arrow_back" className="text-lg" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-apple-gray-600 tracking-tight">{project.name}</h1>
            <Badge color={project.status === 'active' ? 'green' : 'gray'}>
              {project.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-sm text-apple-gray-400 mt-0.5">{project.client}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {project.sharepoint && (
            <a href={project.sharepoint.folderUrl} target="_blank" rel="noopener" className="p-2 hover:bg-teal-50 rounded-lg" title="SharePoint">
              <window.SharePointIcon className="w-5 h-5 text-teal-600" />
            </a>
          )}
          {project.teams && (
            <a href={project.teams.channelUrl} target="_blank" rel="noopener" className="p-2 hover:bg-purple-50 rounded-lg" title="Teams">
              <window.TeamsIcon className="w-5 h-5 text-purple-600" />
            </a>
          )}
          {project.planner && (
            <a href="https://tasks.office.com/" target="_blank" rel="noopener" className="p-2 hover:bg-green-50 rounded-lg" title="Planner">
              <window.PlannerIcon className="w-5 h-5 text-green-600" />
            </a>
          )}
          
          <div className="w-px h-6 bg-apple-gray-200 mx-2" />
          
          <Button variant="secondary" size="small" onClick={() => setShowM365Modal(true)}>
            <Icon name="settings" className="text-base" />
            M365
          </Button>
          <Button variant="secondary" size="small" onClick={() => setShowClientAccessModal(true)}>
            <Icon name="person_add" className="text-base" />
            Acceso
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          {/* Roadmap */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-apple-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-apple-gray-600">Roadmap</h2>
              
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-apple-gray-100 rounded-lg p-0.5">
                  {tabs.map(tab => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id)} 
                      className={`px-2.5 py-1.5 rounded-md transition-colors ${
                        activeTab === tab.id ? 'bg-white shadow-sm' : ''
                      }`}
                    >
                      <Icon name={tab.icon} className={`text-base ${activeTab === tab.id ? 'text-apple-gray-600' : 'text-apple-gray-400'}`} />
                    </button>
                  ))}
                </div>
                
                <Button size="small" variant="ghost" onClick={() => { setEditingPhase(null); setShowPhaseModal(true); }}>
                  <Icon name="add" className="text-base" /> Fase
                </Button>
                <Button size="small" variant="ghost" onClick={() => { setEditingSession(null); setShowSessionModal(true); }}>
                  <Icon name="add" className="text-base" /> Sesión
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

          {/* Tasks */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-apple-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-apple-gray-600">Tareas</h2>
                <span className="text-xs text-apple-gray-400">({tasks.length})</span>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={taskFilter} 
                  onChange={e => setTaskFilter(e.target.value)} 
                  className="text-xs px-2 py-1.5 bg-apple-gray-50 border border-apple-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Completadas</option>
                  <option value="public">Públicas</option>
                  <option value="internal">Internas</option>
                </select>
                
                <Button size="small" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
                  <Icon name="add" className="text-base" /> Tarea
                </Button>
              </div>
            </div>
            
            <div className="divide-y divide-apple-gray-100">
              {filteredTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => { setEditingTask(t); setShowTaskModal(true); }} 
                  className="flex items-center gap-4 px-6 py-4 hover:bg-apple-gray-50 cursor-pointer transition-colors"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    t.status === 'completed' ? 'bg-apple-green border-apple-green' : 
                    t.status === 'in_progress' ? 'border-apple-orange' : 'border-apple-gray-300'
                  }`}>
                    {t.status === 'completed' && <Icon name="check" className="text-white text-[10px]" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${t.status === 'completed' ? 'text-apple-gray-400 line-through' : 'text-apple-gray-600'}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {t.dueDate && <span className="text-[11px] text-apple-gray-400">{formatDate(t.dueDate)}</span>}
                      <Badge color={t.visibility === 'public' ? 'blue' : 'gray'}>
                        {t.visibility === 'public' ? 'Público' : 'Interno'}
                      </Badge>
                      {t.priority === 'high' && <Badge color="red">Urgente</Badge>}
                    </div>
                  </div>
                  
                  <Icon name="chevron_right" className="text-apple-gray-300 text-lg" />
                </div>
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="py-12">
                  <EmptyState icon="task" title="No hay tareas" description={taskFilter !== 'all' ? 'Prueba otro filtro' : undefined} />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Budget */}
          <BudgetCard project={project} onSave={loadProject} />
          
          {/* Details */}
          <Card>
            <h3 className="text-sm font-medium text-apple-gray-600 mb-4">Detalles</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-apple-gray-400">Estado</span>
                <Badge color={project.status === 'active' ? 'green' : 'gray'}>
                  {project.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-apple-gray-400">Fases</span>
                <span className="text-apple-gray-600 font-medium">{phases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-apple-gray-400">Sesiones</span>
                <span className="text-apple-gray-600 font-medium">{sessions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-apple-gray-400">Tareas</span>
                <span className="text-apple-gray-600 font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-apple-gray-100">
                <span className="text-apple-gray-400">Creado</span>
                <span className="text-apple-gray-600">{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {window.PhaseModal && (
        <window.PhaseModal isOpen={showPhaseModal} onClose={() => setShowPhaseModal(false)} phase={editingPhase} projectId={projectId} phases={phases} onSave={loadProject} />
      )}
      {window.SessionModal && (
        <window.SessionModal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} session={editingSession} projectId={projectId} phases={phases} onSave={loadProject} />
      )}
      {window.TaskModal && (
        <window.TaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} task={editingTask} projectId={projectId} phases={phases} onSave={loadProject} />
      )}
      {window.ClientAccessModal && (
        <window.ClientAccessModal isOpen={showClientAccessModal} onClose={() => setShowClientAccessModal(false)} project={project} onSave={loadProject} />
      )}
      {window.M365SetupModal && (
        <window.M365SetupModal isOpen={showM365Modal} onClose={() => setShowM365Modal(false)} project={project} onSave={loadProject} />
      )}
    </div>
  );
};

// ============================================
// BUDGET CARD
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
      toast.success('Guardado');
      setEditing(false);
      onSave();
    } catch (e) {
      toast.error('Error');
    }
    setSaving(false);
  };

  const addAddOnItem = () => {
    if (!newAddOn.name || !newAddOn.price) return;
    setAddOns([...addOns, { id: Date.now().toString(), name: newAddOn.name, price: parseFloat(newAddOn.price) }]);
    setNewAddOn({ name: '', price: '' });
  };

  const removeAddOn = (id) => setAddOns(addOns.filter(a => a.id !== id));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-apple-gray-600">Presupuesto</h3>
        <button onClick={() => setEditing(!editing)} className="text-xs text-apple-blue hover:underline">
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-apple-gray-400 mb-1">Precio base</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={pricing.basePrice} 
                onChange={e => setPricing({ ...pricing, basePrice: parseFloat(e.target.value) || 0 })} 
                className="flex-1 px-3 py-2 text-sm bg-apple-gray-50 border border-apple-gray-200 rounded-lg focus:outline-none focus:border-apple-blue" 
              />
              <span className="text-apple-gray-400 text-sm">€</span>
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={pricing.vatExempt} 
              onChange={e => setPricing({ ...pricing, vatExempt: e.target.checked })} 
              className="w-4 h-4 rounded border-apple-gray-300"
            />
            <span className="text-sm text-apple-gray-500">Exento de IVA</span>
          </label>
          
          <div>
            <label className="block text-xs text-apple-gray-400 mb-2">Add-ons</label>
            {addOns.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-apple-gray-100">
                <span className="text-sm text-apple-gray-600">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-apple-gray-600">{formatCurrency(a.price)}</span>
                  <button onClick={() => removeAddOn(a.id)} className="text-apple-red hover:opacity-70">
                    <Icon name="close" className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2 mt-2">
              <input type="text" placeholder="Nombre" value={newAddOn.name} onChange={e => setNewAddOn({ ...newAddOn, name: e.target.value })} className="flex-1 px-2 py-1.5 text-sm bg-apple-gray-50 border border-apple-gray-200 rounded" />
              <input type="number" placeholder="€" value={newAddOn.price} onChange={e => setNewAddOn({ ...newAddOn, price: e.target.value })} className="w-20 px-2 py-1.5 text-sm bg-apple-gray-50 border border-apple-gray-200 rounded" />
              <button onClick={addAddOnItem} className="px-2 py-1.5 bg-apple-gray-100 rounded hover:bg-apple-gray-200">
                <Icon name="add" className="text-sm text-apple-gray-600" />
              </button>
            </div>
          </div>
          
          <Button onClick={handleSave} loading={saving} className="w-full">
            Guardar
          </Button>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-apple-gray-400">Base</span>
            <span className="text-apple-gray-600">{formatCurrency(pricing.basePrice)}</span>
          </div>
          
          {addOns.map(a => (
            <div key={a.id} className="flex justify-between">
              <span className="text-apple-gray-400">{a.name}</span>
              <span className="text-apple-gray-600">{formatCurrency(a.price)}</span>
            </div>
          ))}
          
          <div className="border-t border-apple-gray-100 pt-3 mt-3">
            <div className="flex justify-between">
              <span className="text-apple-gray-400">Subtotal</span>
              <span className="text-apple-gray-600">{formatCurrency(revenue.subtotal)}</span>
            </div>
            
            {!pricing.vatExempt && (
              <div className="flex justify-between">
                <span className="text-apple-gray-400">IVA ({pricing.vatRate}%)</span>
                <span className="text-apple-gray-600">{formatCurrency(revenue.vatAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between mt-2">
              <span className="font-medium text-apple-gray-600">Total</span>
              <span className="font-semibold text-lg pv-gradient-text">{formatCurrency(revenue.total)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

window.ProjectDetailView = ProjectDetailView;
window.BudgetCard = BudgetCard;
