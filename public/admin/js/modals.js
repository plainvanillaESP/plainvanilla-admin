// ============================================
// PLAIN VANILLA ADMIN - MODALS
// Todos los modales del sistema
// ============================================

const { useState, useEffect } = React;

// Get components and utilities from window
const { Icon, Modal, Button, Input, Select, Textarea, Badge } = window;
const { 
  api, formatDate, formatCurrency, minDateStr, 
  validateDateNotTooOld, validateEndAfterStart, useToast 
} = window;

// ============================================
// PHASE MODAL
// ============================================

const PhaseModal = ({ isOpen, onClose, phase, projectId, phases, onSave }) => {
  const [form, setForm] = useState({ 
    name: '', description: '', startDate: '', endDate: '', order: phases.length 
  });
  const [dateError, setDateError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (phase) {
      setForm({
        name: phase.name || '',
        description: phase.description || '',
        startDate: phase.startDate || '',
        endDate: phase.endDate || '',
        order: phase.order ?? 0
      });
    } else {
      setForm({ name: '', description: '', startDate: '', endDate: '', order: phases.length });
    }
    setDateError('');
  }, [phase, isOpen]);

  const handleDateChange = (field, value) => {
    if (value && !validateDateNotTooOld(value)) {
      setDateError('No se permiten fechas de mÃ¡s de 1 aÃ±o en el pasado');
      return;
    }
    
    const newForm = { ...form, [field]: value };
    
    if (field === 'endDate' && newForm.startDate && value < newForm.startDate) {
      setDateError('La fecha de fin no puede ser anterior a la de inicio');
      return;
    }
    
    if (field === 'startDate' && newForm.endDate && value > newForm.endDate) {
      setDateError('La fecha de inicio no puede ser posterior a la de fin');
      return;
    }
    
    setDateError('');
    setForm(newForm);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error('El nombre es requerido');
      return;
    }
    
    setLoading(true);
    try {
      if (phase) {
        await api.put(`/api/projects/${projectId}/phases/${phase.id}`, form);
        toast.success('Fase actualizada');
      } else {
        await api.post(`/api/projects/${projectId}/phases`, form);
        toast.success('Fase creada');
      }
      onClose();
      onSave();
    } catch (e) {
      toast.error(e.error || 'Error al guardar');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Â¿Eliminar esta fase?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/projects/${projectId}/phases/${phase.id}`);
      toast.success('Fase eliminada');
      onClose();
      onSave();
    } catch (e) {
      toast.error('Error al eliminar');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={phase ? 'Editar fase' : 'Nueva fase'}>
      <div className="space-y-4">
        <Input
          label="Nombre"
          required
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Ej: Discovery"
        />
        
        <Textarea
          label="DescripciÃ³n"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha inicio"
            type="date"
            value={form.startDate}
            onChange={e => handleDateChange('startDate', e.target.value)}
            min={minDateStr}
          />
          <Input
            label="Fecha fin"
            type="date"
            value={form.endDate}
            onChange={e => handleDateChange('endDate', e.target.value)}
            min={form.startDate || minDateStr}
          />
        </div>
        
        {dateError && (
          <div className="text-red-500 text-sm">{dateError}</div>
        )}
        
        <div className="flex justify-between pt-4">
          {phase && (
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              Eliminar
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !!dateError}>
              {loading ? 'Guardando...' : (phase ? 'Guardar' : 'Crear')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// SESSION MODAL
// ============================================

const SessionModal = ({ isOpen, onClose, session, projectId, phases, onSave }) => {
  const [form, setForm] = useState({
    title: '', date: '', time: '10:00', duration: 60, 
    type: 'online', location: '', phaseId: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showConflictPopup, setShowConflictPopup] = useState(false);
  const [conflict, setConflict] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (session) {
      setForm({
        title: session.title || '',
        date: session.date || '',
        time: session.time || '10:00',
        duration: session.duration || 60,
        type: session.type || 'online',
        location: session.location || '',
        phaseId: session.phaseId || '',
        description: session.description || ''
      });
    } else {
      setForm({
        title: '', date: '', time: '10:00', duration: 60,
        type: 'online', location: '', phaseId: phases[0]?.id || '', description: ''
      });
    }
  }, [session, isOpen, phases]);

  const checkConflict = () => {
    if (!form.phaseId || !form.date) return null;
    const phase = phases.find(p => p.id === form.phaseId);
    if (!phase || !phase.startDate || !phase.endDate) return null;
    
    if (form.date < phase.startDate || form.date > phase.endDate) {
      return { phase, sessionDate: form.date };
    }
    return null;
  };

  const handleSave = async (skipConflictCheck = false) => {
    if (!form.title || !form.date) {
      toast.error('TÃ­tulo y fecha son requeridos');
      return;
    }
    
    if (!skipConflictCheck) {
      const c = checkConflict();
      if (c) {
        setConflict(c);
        setShowConflictPopup(true);
        return;
      }
    }
    
    setLoading(true);
    try {
      if (session) {
        await api.put(`/api/projects/${projectId}/sessions/${session.id}`, form);
        toast.success('SesiÃ³n actualizada');
      } else {
        await api.post(`/api/projects/${projectId}/sessions`, form);
        toast.success('SesiÃ³n creada');
      }
      onClose();
      onSave();
    } catch (e) {
      toast.error(e.error || 'Error al guardar');
    }
    setLoading(false);
  };

  const handleConflictOption = async (option) => {
    setShowConflictPopup(false);
    
    if (option === 'extend') {
      // Extend phase range
      const phase = conflict.phase;
      const updates = {};
      if (form.date < phase.startDate) updates.startDate = form.date;
      if (form.date > phase.endDate) updates.endDate = form.date;
      
      try {
        await api.put(`/api/projects/${projectId}/phases/${phase.id}`, updates);
        toast.info('Fase extendida');
        handleSave(true);
      } catch (e) {
        toast.error('Error al extender fase');
      }
    } else if (option === 'noPhase') {
      setForm({ ...form, phaseId: '' });
      handleSave(true);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Â¿Eliminar esta sesiÃ³n?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/projects/${projectId}/sessions/${session.id}`);
      toast.success('SesiÃ³n eliminada');
      onClose();
      onSave();
    } catch (e) {
      toast.error('Error al eliminar');
    }
    setLoading(false);
  };

  return (
    <>
      <Modal 
        isOpen={isOpen && !showConflictPopup} 
        onClose={onClose} 
        title={session ? 'Editar sesiÃ³n' : 'Nueva sesiÃ³n'}
      >
        <div className="space-y-4">
          <Input
            label="TÃ­tulo"
            required
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Ej: Kickoff Meeting"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              required
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              min={minDateStr}
            />
            <Input
              label="Hora"
              type="time"
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="DuraciÃ³n (min)"
              type="number"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
            />
            <Select
              label="Tipo"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'online', label: 'Online (Teams)' },
                { value: 'presencial', label: 'Presencial' }
              ]}
            />
          </div>
          
          {form.type === 'presencial' && (
            <Input
              label="UbicaciÃ³n"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Ej: Oficina Madrid"
            />
          )}
          
          <Select
            label="Fase"
            value={form.phaseId}
            onChange={e => setForm({ ...form, phaseId: e.target.value })}
            options={[
              { value: '', label: 'Sin fase' },
              ...phases.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
          
          <div className="flex justify-between pt-4">
            {session && (
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button onClick={() => handleSave()} disabled={loading}>
                {loading ? 'Guardando...' : (session ? 'Guardar' : 'Crear')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Conflict Popup */}
      <Modal 
        isOpen={showConflictPopup} 
        onClose={() => setShowConflictPopup(false)} 
        title="âš ï¸ Fecha fuera de rango" 
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            La fecha <strong>{formatDate(conflict?.sessionDate)}</strong> estÃ¡ fuera del rango 
            de la fase "<strong>{conflict?.phase?.name}</strong>" 
            ({formatDate(conflict?.phase?.startDate)} - {formatDate(conflict?.phase?.endDate)}).
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => handleConflictOption('extend')} 
              className="w-full"
            >
              <Icon name="expand" /> Extender rango de la fase
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setShowConflictPopup(false)} 
              className="w-full"
            >
              <Icon name="edit_calendar" /> Cambiar fecha de la sesiÃ³n
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleConflictOption('noPhase')} 
              className="w-full"
            >
              <Icon name="link_off" /> Crear sin asignar a fase
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ============================================
// TASK MODAL
// ============================================

const TaskModal = ({ isOpen, onClose, task, projectId, phases, onSave }) => {
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '', phaseId: '',
    visibility: 'public', assignedToType: '', priority: 'medium', status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate || '',
        phaseId: task.phaseId || '',
        visibility: task.visibility || 'public',
        assignedToType: task.assignedToType || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending'
      });
    } else {
      setForm({
        title: '', description: '', dueDate: '', phaseId: '',
        visibility: 'public', assignedToType: '', priority: 'medium', status: 'pending'
      });
    }
  }, [task, isOpen]);

  const handleSave = async () => {
    if (!form.title) {
      toast.error('El tÃ­tulo es requerido');
      return;
    }
    
    setLoading(true);
    try {
      if (task) {
        await api.put(`/api/projects/${projectId}/tasks/${task.id}`, form);
        toast.success('Tarea actualizada');
      } else {
        await api.post(`/api/projects/${projectId}/tasks`, form);
        toast.success('Tarea creada');
      }
      onClose();
      onSave();
    } catch (e) {
      toast.error(e.error || 'Error al guardar');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Â¿Eliminar esta tarea?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/projects/${projectId}/tasks/${task.id}`);
      toast.success('Tarea eliminada');
      onClose();
      onSave();
    } catch (e) {
      toast.error('Error al eliminar');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Editar tarea' : 'Nueva tarea'}>
      <div className="space-y-4">
        <Input
          label="TÃ­tulo"
          required
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: Preparar documentaciÃ³n"
        />
        
        <Textarea
          label="DescripciÃ³n"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha lÃ­mite"
            type="date"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
          />
          <Select
            label="Fase"
            value={form.phaseId}
            onChange={e => setForm({ ...form, phaseId: e.target.value })}
            options={[
              { value: '', label: 'Sin fase' },
              ...phases.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Visibilidad"
            value={form.visibility}
            onChange={e => setForm({ ...form, visibility: e.target.value })}
            options={[
              { value: 'public', label: 'PÃºblica' },
              { value: 'internal', label: 'Interna' }
            ]}
          />
          <Select
            label="Asignada a"
            value={form.assignedToType}
            onChange={e => setForm({ ...form, assignedToType: e.target.value })}
            options={[
              { value: '', label: 'Sin asignar' },
              { value: 'client', label: 'Cliente' },
              { value: 'team', label: 'Equipo PV' }
            ]}
          />
          <Select
            label="Prioridad"
            value={form.priority}
            onChange={e => setForm({ ...form, priority: e.target.value })}
            options={[
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' }
            ]}
          />
        </div>
        
        {task && (
          <Select
            label="Estado"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'in_progress', label: 'En progreso' },
              { value: 'completed', label: 'Completada' }
            ]}
          />
        )}
        
        <div className="flex justify-between pt-4">
          {task && (
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              Eliminar
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : (task ? 'Guardar' : 'Crear')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// CLIENT ACCESS MODAL
// ============================================

const ClientAccessModal = ({ isOpen, onClose, project, onSave }) => {
  const [accesses, setAccesses] = useState([]);
  const [form, setForm] = useState({ email: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const loadAccesses = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/projects/${project.id}/client-access`);
      setAccesses(data);
    } catch (e) {
      toast.error('Error al cargar accesos');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) loadAccesses();
  }, [isOpen]);

  const handleCreate = async () => {
    if (!form.email) {
      toast.error('Email es requerido');
      return;
    }
    
    setCreating(true);
    try {
      await api.post(`/api/projects/${project.id}/client-access`, form);
      toast.success('Acceso creado y email enviado');
      setForm({ email: '', name: '' });
      loadAccesses();
    } catch (e) {
      toast.error(e.error || 'Error al crear acceso');
    }
    setCreating(false);
  };

  const handleResend = async (userId) => {
    try {
      await api.post(`/api/projects/${project.id}/client-access/${userId}/resend`);
      toast.success('Email reenviado');
    } catch (e) {
      toast.error('Error al reenviar');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Â¿Eliminar este acceso?')) return;
    
    try {
      await api.delete(`/api/projects/${project.id}/client-access/${userId}`);
      toast.success('Acceso eliminado');
      loadAccesses();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const portalUrl = `${window.location.origin}/portal/${project.slug}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acceso cliente" size="lg">
      <div className="space-y-6">
        {/* Create New Access */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-800 mb-3">Crear nuevo acceso</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email del cliente"
            />
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre (opcional)"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creando...' : 'Crear y enviar email'}
          </Button>
        </div>
        
        {/* Portal URL */}
        <div className="p-4 bg-purple-50 rounded-xl">
          <h4 className="font-medium text-gray-800 mb-2">URL del portal</h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm text-gray-600 border">
              /portal/{project.slug}
            </code>
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(portalUrl); 
                toast.info('URL copiada'); 
              }} 
              className="p-2 hover:bg-purple-100 rounded-lg"
            >
              <Icon name="content_copy" className="text-purple-600" />
            </button>
          </div>
        </div>
        
        {/* Existing Accesses */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Accesos existentes</h4>
          {loading ? (
            <div className="text-center py-4 text-gray-400">Cargando...</div>
          ) : accesses.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No hay accesos creados</div>
          ) : (
            <div className="space-y-2">
              {accesses.map(a => (
                <div key={a.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Icon name="person" className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">{a.name || a.email}</div>
                    <div className="text-sm text-gray-400">{a.email}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleResend(a.user_id)} 
                      className="p-2 hover:bg-gray-200 rounded-lg" 
                      title="Reenviar email"
                    >
                      <Icon name="send" className="text-gray-500 text-sm" />
                    </button>
                    <button 
                      onClick={() => handleDelete(a.user_id)} 
                      className="p-2 hover:bg-red-100 rounded-lg" 
                      title="Eliminar"
                    >
                      <Icon name="delete" className="text-red-500 text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// M365 SETUP MODAL
// ============================================

const M365SetupModal = ({ isOpen, onClose, project, onSave }) => {
  const [sites, setSites] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesData, teamsData, groupsData] = await Promise.all([
        api.get('/api/sharepoint/sites'),
        api.get('/api/teams'),
        api.get('/api/groups')
      ]);
      setSites(sitesData || []);
      setTeams(teamsData || []);
      setGroups(groupsData || []);
    } catch (e) {
      toast.error('Error al cargar datos de Microsoft 365');
    }
    setLoading(false);
  };

  const handleSetup = async () => {
    setSaving(true);
    try {
      await api.post(`/api/projects/${project.id}/setup-all`, {
        siteId: selectedSite || undefined,
        teamId: selectedTeam || undefined,
        groupId: selectedGroup || undefined
      });
      toast.success('Microsoft 365 configurado');
      onClose();
      onSave();
    } catch (e) {
      toast.error(e.error || 'Error al configurar');
    }
    setSaving(false);
  };

  const IntegrationCard = ({ title, icon: IconComponent, color, connected, children }) => (
    <div className={`p-4 rounded-xl ${connected ? `bg-${color}-50 border border-${color}-200` : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3 mb-3">
        <IconComponent className={`w-6 h-6 text-${color}-600`} />
        <h4 className="font-medium text-gray-800">{title}</h4>
        {connected && <Badge color="green">Conectado</Badge>}
      </div>
      {children}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Microsoft 365" size="lg">
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <Icon name="hourglass_empty" className="text-4xl animate-spin mb-2" />
          <div>Cargando datos de Microsoft 365...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SharePoint */}
          <IntegrationCard 
            title="SharePoint" 
            icon={window.SharePointIcon} 
            color="teal" 
            connected={!!project.sharepoint}
          >
            {project.sharepoint ? (
              <a 
                href={project.sharepoint.folderUrl} 
                target="_blank" 
                rel="noopener" 
                className="text-sm text-teal-600 hover:underline"
              >
                Abrir carpeta en SharePoint â†’
              </a>
            ) : (
              <select 
                value={selectedSite} 
                onChange={e => setSelectedSite(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              >
                <option value="">Seleccionar sitio...</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.displayName}</option>
                ))}
              </select>
            )}
          </IntegrationCard>
          
          {/* Teams */}
          <IntegrationCard 
            title="Teams" 
            icon={window.TeamsIcon} 
            color="purple" 
            connected={!!project.teams}
          >
            {project.teams ? (
              <a 
                href={project.teams.channelUrl} 
                target="_blank" 
                rel="noopener" 
                className="text-sm text-purple-600 hover:underline"
              >
                Abrir canal en Teams â†’
              </a>
            ) : (
              <select 
                value={selectedTeam} 
                onChange={e => setSelectedTeam(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              >
                <option value="">Seleccionar equipo...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.displayName}</option>
                ))}
              </select>
            )}
          </IntegrationCard>
          
          {/* Planner */}
          <IntegrationCard 
            title="Planner" 
            icon={window.PlannerIcon} 
            color="green" 
            connected={!!project.planner}
          >
            {project.planner ? (
              <span className="text-sm text-green-600">
                Plan: {project.planner.planTitle || project.planner.planId}
              </span>
            ) : (
              <select 
                value={selectedGroup} 
                onChange={e => setSelectedGroup(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              >
                <option value="">Seleccionar grupo...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.displayName}</option>
                ))}
              </select>
            )}
          </IntegrationCard>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            {(!project.sharepoint || !project.teams || !project.planner) && (
              <Button 
                onClick={handleSetup} 
                disabled={saving || (!selectedSite && !selectedTeam && !selectedGroup)}
              >
                {saving ? 'Configurando...' : 'Configurar seleccionados'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

// Export to window
window.PhaseModal = PhaseModal;
window.SessionModal = SessionModal;
window.TaskModal = TaskModal;
window.ClientAccessModal = ClientAccessModal;
window.M365SetupModal = M365SetupModal;
