// ============================================
// PLAIN VANILLA ADMIN - PROJECTS LIST
// Vista de lista de proyectos
// ============================================

const { useState } = React;

// Get components and utilities from window
const { Icon, Card, Button, Modal, Input, Textarea, EmptyState } = window;
const { api, formatDate, getProjectDates, calculateProjectRevenue, generateSlug, useToast } = window;

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
      toast.success('Proyecto creado');
      setShowModal(false);
      setForm({ name: '', client: '', description: '' });
      onRefresh();
    } catch (e) {
      toast.error(e.error || 'Error al crear proyecto');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Proyectos</h1>
          <p className="text-gray-500">{projects.length} proyectos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Icon name="add" />
          Nuevo proyecto
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon="folder_off"
            title="No hay proyectos"
            description="Crea tu primer proyecto para empezar"
            action={
              <Button onClick={() => setShowModal(true)}>
                <Icon name="add" />
                Crear proyecto
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const { start, end } = getProjectDates(p);
            const revenue = calculateProjectRevenue(p);
            
            return (
              <Card 
                key={p.id} 
                onClick={() => onSelectProject(p.id)} 
                className="p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg">
                    {p.client?.charAt(0) || 'P'}
                  </div>
                  <div className="flex items-center gap-1">
                    {p.sharepoint && <window.SharePointIcon className="w-5 h-5 text-teal-600" />}
                    {p.teams && <window.TeamsIcon className="w-5 h-5 text-purple-600" />}
                    {p.planner && <window.PlannerIcon className="w-5 h-5 text-green-600" />}
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-1">{p.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{p.client}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {start ? formatDate(start) : 'Sin fechas'}
                  </span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(revenue.total)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span>{(p.phases || []).length} fases</span>
                  <span>•</span>
                  <span>{(p.sessions || []).length} sesiones</span>
                  <span>•</span>
                  <span>{(p.tasks || []).length} tareas</span>
                </div>
              </Card>
            );
          })}
          
          {/* New Project Card */}
          <Card 
            onClick={() => setShowModal(true)} 
            className="p-5 border-2 border-dashed border-gray-200 hover:border-pv-purple flex items-center justify-center min-h-[180px]"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Icon name="add" className="text-gray-400 text-2xl" />
              </div>
              <span className="text-gray-400">Nuevo proyecto</span>
            </div>
          </Card>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Nuevo proyecto"
      >
        <div className="space-y-4">
          <Input
            label="Nombre del proyecto"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Adopción Microsoft 365"
          />
          
          <Input
            label="Cliente"
            required
            value={form.client}
            onChange={e => setForm({ ...form, client: e.target.value })}
            placeholder="Ej: Empresa ABC"
          />
          
          <Textarea
            label="Descripción"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción opcional..."
            rows={3}
          />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Creando...' : 'Crear proyecto'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Export to window
window.ProjectsView = ProjectsView;
