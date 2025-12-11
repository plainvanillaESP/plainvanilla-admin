// ============================================
// PLAIN VANILLA ADMIN - PROJECT DETAIL
// Vista detalle de proyecto
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
      <div className="p-6 text-center text-gray-500">
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

  // Get view component based on active tab
  const ViewComponent = {
    timeline: window.TimelineView,
    kanban: window.KanbanView,
    calendar: window.CalendarView,
    gantt: window.GanttView
  }[activeTab];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Icon name="arrow_back" className="text-gray-600" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            <Badge color={project.status === 'active' ? 'green' : 'gray'}>
              {project.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-gray-500">{project.client}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* M365 Links */}
          {project.sharepoint && (
            <a 
              href={project.sharepoint.folderUrl} 
              target="_blank" 
              rel="noopener" 
              className="p-2 hover:bg-teal-50 rounded-xl" 
              title="SharePoint"
            >
              <window.SharePointIcon className="w-6 h-6 text-teal-600" />
            </a>
          )}
          {project.teams && (
            <a 
              href={project.teams.channelUrl} 
              target="_blank" 
              rel="noopener" 
              className="p-2 hover:bg-purple-50 rounded-xl" 
              title="Teams"
            >
              <window.TeamsIcon className="w-6 h-6 text-purple-600" />
            </a>
          )}
          {project.planner && (
            <a 
              href="https://tasks.office.com/" 
              target="_blank" 
              rel="noopener" 
              className="p-2 hover:bg-green-50 rounded-xl" 
              title="Planner"
            >
              <window.PlannerIcon className="w-6 h-6 text-green-600" />
            </a>
          )}
          
          <Button variant="outline" onClick={() => setShowM365Modal(true)}>
            <Icon name="settings" />
            Microsoft 365
          </Button>
          
          <Button variant="outline" onClick={() => setShowClientAccessModal(true)}>
            <Icon name="person_add" />
            Acceso cliente
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Roadmap & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roadmap Card */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="route" className="text-pv-purple" />
                <h2 className="font-semibold text-gray-800">Roadmap</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {[
                    { id: 'timeline', icon: 'timeline' },
                    { id: 'kanban', icon: 'view_kanban' },
                    { id: 'calendar', icon: 'calendar_month' },
                    { id: 'gantt', icon: 'bar_chart' }
                  ].map(tab => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id)} 
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === tab.id ? 'bg-white shadow-sm' : ''
                      }`}
                    >
                      <Icon 
                        name={tab.icon} 
                        className={`text-sm ${activeTab === tab.id ? 'text-pv-purple' : 'text-gray-400'}`} 
                      />
                    </button>
                  ))}
                </div>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => { setEditingPhase(null); setShowPhaseModal(true); }}
                >
                  <Icon name="add" className="text-sm" /> Fase
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => { setEditingSession(null); setShowSessionModal(true); }}
                >
                  <Icon name="add" className="text-sm" /> Sesión
                </Button>
              </div>
            </div>
            
            <div className="p-4">
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
          <Card>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="task_alt" className="text-pv-purple" />
                <h2 className="font-semibold text-gray-800">Tareas</h2>
                <span className="text-sm text-gray-400">({tasks.length})</span>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={taskFilter} 
                  onChange={e => setTaskFilter(e.target.value)} 
                  className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
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
                >
                  <Icon name="add" className="text-sm" /> Tarea
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {filteredTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => { setEditingTask(t); setShowTaskModal(true); }} 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    t.status === 'completed' ? 'bg-green-500 border-green-500' : 
                    t.status === 'in_progress' ? 'border-amber-500' : 'border-gray-300'
                  }`}>
                    {t.status === 'completed' && (
                      <Icon name="check" className="text-white text-xs" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${
                      t.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'
                    }`}>
                      {t.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {t.dueDate && (
                        <span className="text-xs text-gray-400">{formatDate(t.dueDate)}</span>
                      )}
                      <Badge color={t.visibility === 'public' ? 'blue' : 'gray'}>
                        {t.visibility === 'public' ? 'Público' : 'Interno'}
                      </Badge>
                      {t.assignedToType === 'client' && (
                        <Badge color="purple">Cliente</Badge>
                      )}
                      {t.priority === 'high' && (
                        <Badge color="red">Urgente</Badge>
                      )}
                    </div>
                  </div>
                  
                  <Icon name="chevron_right" className="text-gray-300" />
                </div>
              ))}
              
              {filteredTasks.length === 0 && (
                <EmptyState
                  icon="task"
                  title="No hay tareas"
                  description={taskFilter !== 'all' ? 'Prueba con otro filtro' : undefined}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Budget & Details */}
        <div className="space-y-6">
          {/* Budget Card */}
          <BudgetCard project={project} onSave={loadProject} />
          
          {/* Details Card */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon name="info" className="text-gray-400" />
              Detalles
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <Badge color={project.status === 'active' ? 'green' : 'gray'}>
                  {project.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fases</span>
                <span className="font-medium">{phases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sesiones</span>
                <span className="font-medium">{sessions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tareas</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Creado</span>
                <span className="font-medium">{formatDate(project.createdAt)}</span>
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
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Icon name="euro" className="text-green-500" />
          Presupuesto
        </h3>
        <button 
          onClick={() => setEditing(!editing)} 
          className="text-sm text-pv-purple hover:underline"
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* Base Price */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Precio base (sin IVA)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={pricing.basePrice} 
                onChange={e => setPricing({ ...pricing, basePrice: parseFloat(e.target.value) || 0 })} 
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pv-purple/20" 
              />
              <span className="text-gray-500">€</span>
            </div>
          </div>
          
          {/* VAT Exempt */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={pricing.vatExempt} 
              onChange={e => setPricing({ ...pricing, vatExempt: e.target.checked })} 
              className="rounded border-gray-300" 
            />
            <label className="text-sm text-gray-600">Exento de IVA</label>
          </div>
          
          {/* Add-ons */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">Add-ons</label>
            {addOns.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatCurrency(a.price)}</span>
                  <button 
                    onClick={() => removeAddOn(a.id)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    <Icon name="close" className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                placeholder="Nombre" 
                value={newAddOn.name} 
                onChange={e => setNewAddOn({ ...newAddOn, name: e.target.value })} 
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded" 
              />
              <input 
                type="number" 
                placeholder="€" 
                value={newAddOn.price} 
                onChange={e => setNewAddOn({ ...newAddOn, price: e.target.value })} 
                className="w-20 px-2 py-1 text-sm border border-gray-200 rounded" 
              />
              <button 
                onClick={addAddOnItem} 
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                <Icon name="add" className="text-sm" />
              </button>
            </div>
          </div>
          
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Base</span>
            <span className="font-medium">{formatCurrency(pricing.basePrice)}</span>
          </div>
          
          {addOns.map(a => (
            <div key={a.id} className="flex justify-between text-sm">
              <span className="text-gray-500">{a.name}</span>
              <span className="font-medium">{formatCurrency(a.price)}</span>
            </div>
          ))}
          
          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(revenue.subtotal)}</span>
            </div>
            
            {!pricing.vatExempt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IVA ({pricing.vatRate}%)</span>
                <span>{formatCurrency(revenue.vatAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold mt-2">
              <span>Total</span>
              <span className="gradient-text">{formatCurrency(revenue.total)}</span>
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
