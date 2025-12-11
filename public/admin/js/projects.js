// ============================================
// PLAIN VANILLA - PROJECTS LIST
// Apple-style: minimal, clean, elegant
// ============================================

const { useState } = React;
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
      toast.success('Proyecto creado');
      setShowModal(false);
      setForm({ name: '', client: '', description: '' });
      onRefresh();
    } catch (e) {
      toast.error(e.error || 'Error al crear');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-apple-gray-600 tracking-tight">Proyectos</h1>
          <p className="text-sm text-apple-gray-400 mt-0.5">{projects.length} proyectos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Icon name="add" className="text-base" />
          Nuevo
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="py-16">
          <EmptyState
            icon="folder"
            title="Sin proyectos"
            description="Crea tu primer proyecto"
            action={
              <Button onClick={() => setShowModal(true)}>
                <Icon name="add" className="text-base" />
                Crear proyecto
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {projects.map(p => {
            const { start } = getProjectDates(p);
            const revenue = calculateProjectRevenue(p);
            
            return (
              <Card 
                key={p.id} 
                onClick={() => onSelectProject(p.id)}
                className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg pv-gradient flex items-center justify-center text-white text-sm font-medium">
                    {p.client?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex items-center gap-1">
                    {p.sharepoint && <window.SharePointIcon className="w-4 h-4 text-teal-600" />}
                    {p.teams && <window.TeamsIcon className="w-4 h-4 text-purple-600" />}
                    {p.planner && <window.PlannerIcon className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-apple-gray-600 mb-0.5">{p.name}</h3>
                <p className="text-xs text-apple-gray-400 mb-4">{p.client}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-apple-gray-400">
                    {start ? formatDate(start) : 'Sin fechas'}
                  </span>
                  <span className="font-medium text-apple-gray-600">
                    {formatCurrency(revenue.total)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-apple-gray-100 text-[11px] text-apple-gray-400">
                  <span>{(p.phases || []).length} fases</span>
                  <span>{(p.sessions || []).length} sesiones</span>
                  <span>{(p.tasks || []).length} tareas</span>
                </div>
              </Card>
            );
          })}
          
          {/* New Project Card */}
          <div 
            onClick={() => setShowModal(true)} 
            className="bg-white rounded-2xl p-6 border-2 border-dashed border-apple-gray-200 hover:border-apple-gray-300 flex items-center justify-center min-h-[180px] cursor-pointer transition-colors"
          >
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-apple-gray-100 flex items-center justify-center mx-auto mb-2">
                <Icon name="add" className="text-apple-gray-400 text-xl" />
              </div>
              <span className="text-xs text-apple-gray-400">Nuevo proyecto</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
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
              Crear
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
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
            placeholder="Opcional..."
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

window.ProjectsView = ProjectsView;
