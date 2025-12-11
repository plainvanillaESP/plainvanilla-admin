// ============================================
// PLAIN VANILLA ADMIN - PROJECTS LIST
// Diseño Apple-style: limpio, elegante, minimalista
// ============================================

const { useState } = React;

// Get components and utilities from window
const { Icon, Card, Button, Modal, Input, Textarea, EmptyState } = window;
const { api, formatDate, formatCurrency, getProjectDates, calculateProjectRevenue, generateSlug, useToast } = window;

// ============================================
// PROJECTS VIEW
// ============================================

const ProjectsView = ({ projects, onSelectProject, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', client: '', description: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleCreate = async () => {
    if (!form.name || !form.client) {
      toast.error('Nombre y cliente son requeridos');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/api/projects', {
        ...form,
        clientSlug: generateSlug(form.client)
      });
      toast.success('Proyecto creado correctamente');
      setShowModal(false);
      setForm({ name: '', client: '', description: '' });
      onRefresh();
    } catch (e) {
      toast.error(e.error || 'Error al crear proyecto');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Proyectos</h1>
          <p className="text-gray-500 mt-1">{projects.length} proyectos en total</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon="add">
          Nuevo proyecto
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-16" hover={false}>
          <EmptyState
            icon="folder_open"
            title="Sin proyectos"
            description="Crea tu primer proyecto para empezar a gestionar tus clientes"
            action={
              <Button onClick={() => setShowModal(true)} icon="add">
                Crear proyecto
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => {
            const { start, end } = getProjectDates(p);
            const revenue = calculateProjectRevenue(p);
            
            return (
              <Card 
                key={p.id} 
                onClick={() => onSelectProject(p.id)} 
                className="p-6 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="
                    w-12 h-12 rounded-xl 
                    bg-gradient-to-br from-pv-pink to-pv-purple 
                    flex items-center justify-center 
                    text-white font-semibold text-lg
                    shadow-lg shadow-pv-purple/20
                    group-hover:shadow-xl group-hover:shadow-pv-purple/30
                    transition-shadow duration-300
                  ">
                    {p.client?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex items-center gap-1.5">
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
                </div>
                
                {/* Title & Client */}
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-pv-purple transition-colors">
                  {p.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{p.client}</p>
                
                {/* Date & Revenue */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-400">
                    {start ? formatDate(start) : 'Sin fechas'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(revenue.total)}
                  </span>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Icon name="layers" className="text-sm" />
                    <span>{(p.phases || []).length} fases</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Icon name="event" className="text-sm" />
                    <span>{(p.sessions || []).length} sesiones</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Icon name="task_alt" className="text-sm" />
                    <span>{(p.tasks || []).length} tareas</span>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {/* New Project Card */}
          <div 
            onClick={() => setShowModal(true)} 
            className="
              bg-white rounded-2xl p-6
              border-2 border-dashed border-gray-200 
              hover:border-pv-purple/50 hover:bg-gray-50
              flex items-center justify-center min-h-[220px]
              cursor-pointer transition-all duration-200
              group
            "
          >
            <div className="text-center">
              <div className="
                w-14 h-14 rounded-xl 
                bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-pv-pink/10 group-hover:to-pv-purple/10
                flex items-center justify-center mx-auto mb-3
                transition-all duration-200
              ">
                <Icon name="add" className="text-gray-400 group-hover:text-pv-purple text-2xl transition-colors" />
              </div>
              <span className="text-gray-500 group-hover:text-pv-purple font-medium transition-colors">
                Nuevo proyecto
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Nuevo proyecto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} loading={loading}>
              Crear proyecto
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Nombre del proyecto"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Adopción Microsoft 365"
            icon="folder"
          />
          
          <Input
            label="Cliente"
            required
            value={form.client}
            onChange={e => setForm({ ...form, client: e.target.value })}
            placeholder="Ej: Empresa ABC"
            icon="business"
          />
          
          <Textarea
            label="Descripción"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción opcional del proyecto..."
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

// Export to window
window.ProjectsView = ProjectsView;
