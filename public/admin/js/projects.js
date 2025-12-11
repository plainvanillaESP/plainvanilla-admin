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
  const [form, setForm] = useState({ name: '', client: '', description: '', basePrice: '', setupM365: true });
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
        name: form.name,
        client: form.client,
        description: form.description,
        clientSlug: generateSlug(form.client),
        pricing: { basePrice: form.basePrice === '' ? 0 : parseFloat(form.basePrice), vatExempt: false, vatRate: 21 },
        setupM365: form.setupM365
      });
      toast.success('Proyecto creado');
      setShowModal(false);
      setForm({ name: '', client: '', description: '', basePrice: '', setupM365: true });
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
                <p className="text-sm text-apple-gray-400 mb-4">{p.client}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-apple-gray-400">
                    {start ? formatDate(start) : 'Sin fechas'}
                  </span>
                  <span className="font-medium text-apple-gray-600">
                    {formatCurrency(revenue.total)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-apple-gray-100 text-sm text-apple-gray-400">
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
              <span className="text-sm text-apple-gray-400">Nuevo proyecto</span>
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
          
          <div>
            <label className="block text-sm font-medium text-apple-gray-500 mb-1.5">Presupuesto base (€)</label>
            <input
              type="number"
              value={form.basePrice}
              onChange={e => setForm({ ...form, basePrice: e.target.value })}
              placeholder="Ej: 5000"
              className="w-full px-3 py-2 text-sm bg-apple-gray-50 border border-apple-gray-200 rounded-lg focus:outline-none focus:border-apple-blue"
            />
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
            <input
              type="checkbox"
              id="setupM365"
              checked={form.setupM365}
              onChange={e => setForm({ ...form, setupM365: e.target.checked })}
              className="w-4 h-4 text-pv-purple rounded border-gray-300 focus:ring-pv-purple"
            />
            <label htmlFor="setupM365" className="flex-1 cursor-pointer">
              <div className="font-medium text-sm text-apple-gray-600">Crear recursos Microsoft 365</div>
              <div className="text-xs text-apple-gray-400">Grupo, Teams, SharePoint y Planner automáticos</div>
            </label>
            <div className="flex gap-1">
              <window.TeamsIcon className="w-4 h-4 text-purple-600" />
              <window.SharePointIcon className="w-4 h-4 text-teal-600" />
              <window.PlannerIcon className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

window.ProjectsView = ProjectsView;
