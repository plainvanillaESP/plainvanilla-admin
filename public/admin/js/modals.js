// ============================================
// PLAIN VANILLA ADMIN - MODALS
// Todos los modales del sistema
// ============================================

const { useState, useEffect } = React;

const { Icon, Modal, Button, Input, Select, Textarea, Badge } = window;
const { 
  api, formatDate, formatCurrency, minDateStr, 
  validateDateNotTooOld, validateEndAfterStart, useToast 
} = window;

// ============================================
// PHASE MODAL
// ============================================

const phaseColorOptions = [
  { id: 'purple', bg: 'bg-purple-200', text: 'text-purple-700', label: 'Morado' },
  { id: 'blue', bg: 'bg-blue-200', text: 'text-blue-700', label: 'Azul' },
  { id: 'green', bg: 'bg-green-200', text: 'text-green-700', label: 'Verde' },
  { id: 'amber', bg: 'bg-amber-200', text: 'text-amber-700', label: 'Ámbar' },
  { id: 'pink', bg: 'bg-pink-200', text: 'text-pink-700', label: 'Rosa' },
  { id: 'teal', bg: 'bg-teal-200', text: 'text-teal-700', label: 'Turquesa' },
  { id: 'indigo', bg: 'bg-indigo-200', text: 'text-indigo-700', label: 'Índigo' },
  { id: 'red', bg: 'bg-red-200', text: 'text-red-700', label: 'Rojo' },
];

const PhaseModal = ({ isOpen, onClose, phase, projectId, phases, onSave }) => {
  const [form, setForm] = useState({ 
    name: '', description: '', startDate: '', endDate: '', order: phases.length, color: 'purple'
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
        order: phase.order ?? 0,
        color: phase.color || 'purple'
      });
    } else {
      setForm({ name: '', description: '', startDate: '', endDate: '', order: phases.length, color: 'purple' });
    }
    setDateError('');
  }, [phase, isOpen]);

  const handleDateChange = (field, value) => {
    if (value && !validateDateNotTooOld(value)) {
      setDateError('No se permiten fechas de mas de 1 año en el pasado');
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
    if (!confirm('¿Eliminar esta fase?')) return;
    
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
          label="Descripción"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {phaseColorOptions.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm({ ...form, color: c.id })}
                className={`w-8 h-8 rounded-full ${c.bg} ${form.color === c.id ? 'ring-2 ring-offset-2 ring-purple-500' : ''} hover:scale-110 transition-transform`}
                title={c.label}
              />
            ))}
          </div>
        </div>
        
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
          <p className="text-sm text-red-500">{dateError}</p>
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
// SESSION MODAL - Con busqueda de asistentes
// ============================================

const SessionModal = ({ isOpen, onClose, session, projectId, phases, onSave }) => {
  const [form, setForm] = useState({
    title: '', date: '', time: '10:00', duration: 60, 
    type: 'online', location: '', phaseId: '', description: '',
    attendees: []
  });
  const [loading, setLoading] = useState(false);
  const [showConflictPopup, setShowConflictPopup] = useState(false);
  const [conflict, setConflict] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
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
        description: session.description || '',
        attendees: session.attendees || []
      });
    } else {
      setForm({
        title: '', date: '', time: '10:00', duration: 60,
        type: 'online', location: '', phaseId: phases[0]?.id || '', description: '',
        attendees: []
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  }, [session, isOpen, phases]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await api.get(`/api/contacts/search?projectId=${projectId}&q=${encodeURIComponent(query)}`);
      setSearchResults(results || []);
    } catch (e) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const addAttendee = (person) => {
    const exists = form.attendees.find(a => a.email === person.email);
    if (!exists) {
      setForm({
        ...form,
        attendees: [...form.attendees, {
          email: person.email,
          name: person.name || person.email,
          type: person.source || 'external'
        }]
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAttendee = (email) => {
    setForm({
      ...form,
      attendees: form.attendees.filter(a => a.email !== email)
    });
  };

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
      toast.error('Titulo y fecha son requeridos');
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
        toast.success('Sesion actualizada');
      } else {
        await api.post(`/api/projects/${projectId}/sessions`, form);
        toast.success('Sesion creada');
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
    if (!confirm('Eliminar esta sesion?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/projects/${projectId}/sessions/${session.id}`);
      toast.success('Sesion eliminada');
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
        title={session ? 'Editar sesion' : 'Nueva sesion'}
        size="large"
      >
        <div className="space-y-4">
          <Input
            label="Titulo"
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
              label="Duracion (min)"
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
              label="Ubicacion"
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

          {/* Attendees Section */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-500 mb-1.5">
              Asistentes
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full px-3 py-2 text-sm bg-apple-gray-50 border border-apple-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-apple-blue"
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-4 h-4 border-2 border-apple-gray-300 border-t-apple-blue rounded-full animate-spin" />
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-apple-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {searchResults.map((person, idx) => (
                    <button
                      key={idx}
                      onClick={() => addAttendee(person)}
                      className="w-full px-3 py-2 text-left hover:bg-apple-gray-50 flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-apple-gray-100 flex items-center justify-center">
                        <Icon name="person" className="text-apple-gray-400 text-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-apple-gray-600">{person.name}</div>
                        <div className="text-xs text-apple-gray-400">{person.email}</div>
                      </div>
                      <span className="text-xs text-apple-gray-300">{person.source}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {form.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.attendees.map((a, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm"
                  >
                    <span>{a.name || a.email}</span>
                    <button 
                      onClick={() => removeAttendee(a.email)}
                      className="hover:text-purple-900"
                    >
                      <Icon name="close" className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
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
      
      {/* Conflict Popup - Fixed Width */}
      <Modal 
        isOpen={showConflictPopup} 
        onClose={() => setShowConflictPopup(false)} 
        title="Fecha fuera de rango" 
        size="small"
      >
        <div className="space-y-4" style={{ maxWidth: '400px' }}>
          <p className="text-apple-gray-500">
            La fecha <strong>{formatDate(conflict?.sessionDate)}</strong> esta fuera del rango 
            de la fase "<strong>{conflict?.phase?.name}</strong>" 
            ({formatDate(conflict?.phase?.startDate)} - {formatDate(conflict?.phase?.endDate)}).
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => handleConflictOption('extend')} 
              className="w-full"
            >
              Extender rango de la fase
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setShowConflictPopup(false)} 
              className="w-full"
            >
              Cambiar fecha de la sesion
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handleConflictOption('noPhase')} 
              className="w-full"
            >
              Crear sin asignar a fase
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ============================================
// TASK MODAL - Solo gente del proyecto
// ============================================

const TaskModal = ({ isOpen, onClose, task, projectId, phases, onSave }) => {
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '', phaseId: '',
    visibility: 'public', assignedToType: '', assignedToId: '', 
    assignedToEmail: '', assignedToName: '',
    priority: 'medium', status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
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
        assignedToId: task.assignedToId || '',
        assignedToEmail: task.assignedToEmail || '',
        assignedToName: task.assignedToName || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending'
      });
    } else {
      setForm({
        title: '', description: '', dueDate: '', phaseId: phases[0]?.id || '',
        visibility: 'public', assignedToType: '', assignedToId: '',
        assignedToEmail: '', assignedToName: '',
        priority: 'medium', status: 'pending'
      });
    }
  }, [task, isOpen, phases]);

  useEffect(() => {
    if (isOpen && projectId) {
      loadMembers();
    }
  }, [isOpen, projectId]);

  const loadMembers = async () => {
    // Cargar clientes del proyecto
    try {
      const clients = await api.get(`/api/projects/${projectId}/client-access`);
      setProjectMembers(clients || []);
    } catch (e) {
      console.log('No project members');
    }
    // Cargar equipo Plain Vanilla
    try {
      const allContacts = await api.get('/api/contacts/search?q=plainvanilla.ai');
      const pvTeam = (allContacts || []).filter(c => 
        c.email && 
        c.email.toLowerCase().includes('@plainvanilla.ai') &&
        !c.email.includes('github') &&
        !c.email.includes('exchangelabs')
      );
      setTeamMembers(pvTeam);
    } catch (e) {
      console.log('No team members found');
      setTeamMembers([]);
    }
  };

  const handleAssign = (person) => {
    setForm({
      ...form,
      assignedToType: person.type || 'client',
      assignedToId: person.id || person.user_id || '',
      assignedToEmail: person.email,
      assignedToName: person.name || person.email
    });
  };

  const clearAssignment = () => {
    setForm({
      ...form,
      assignedToType: '',
      assignedToId: '',
      assignedToEmail: '',
      assignedToName: ''
    });
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error('El titulo es requerido');
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
    if (!confirm('Eliminar esta tarea?')) return;
    
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
          label="Titulo"
          required
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: Preparar documentacion"
        />
        
        <Textarea
          label="Descripcion"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha limite"
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
        
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Visibilidad"
            value={form.visibility}
            onChange={e => setForm({ ...form, visibility: e.target.value })}
            options={[
              { value: 'public', label: 'Publica' },
              { value: 'internal', label: 'Interna' }
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
        
                {/* Assignment Section - Con buscador */}
        <div>
          <label className="block text-sm font-medium text-apple-gray-500 mb-1.5">
            Asignar a
          </label>
          
          {form.assignedToEmail ? (
            <div className="flex items-center gap-2 p-2 bg-apple-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Icon name="person" className="text-purple-600 text-sm" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-apple-gray-600">{form.assignedToName}</div>
                <div className="text-xs text-apple-gray-400">{form.assignedToEmail}</div>
              </div>
              <Badge color={form.assignedToType === 'team' ? 'purple' : 'blue'}>
                {form.assignedToType === 'team' ? 'Equipo PV' : 'Cliente'}
              </Badge>
              <button onClick={clearAssignment} className="p-1 hover:bg-apple-gray-200 rounded">
                <Icon name="close" className="text-apple-gray-400 text-sm" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={assignSearch}
                onChange={e => {
                  setAssignSearch(e.target.value);
                  setShowAssignDropdown(true);
                }}
                onFocus={() => setShowAssignDropdown(true)}
                onBlur={() => setTimeout(() => setShowAssignDropdown(false), 200)}
                placeholder="Buscar miembro del proyecto..."
                autoComplete="off"
                className="w-full px-3 py-2 text-sm bg-apple-gray-50 border border-apple-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-apple-blue"
              />
              {showAssignDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-apple-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {[...teamMembers, ...projectMembers]
                    .filter(m => {
                      if (!assignSearch) return true;
                      const q = assignSearch.toLowerCase();
                      return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
                    })
                    .map((m, idx) => {
                      const isTeam = m.email && m.email.includes('@plainvanilla.ai');
                      return (
                        <button
                          key={idx}
                          onMouseDown={() => {
                            handleAssign({ ...m, type: isTeam ? 'team' : 'client' });
                            setAssignSearch('');
                            setShowAssignDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-apple-gray-50 flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-apple-gray-100 flex items-center justify-center">
                            <Icon name="person" className="text-apple-gray-400 text-sm" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-apple-gray-600">{m.name || m.email}</div>
                            <div className="text-xs text-apple-gray-400">{m.email}</div>
                          </div>
                          <span className={`text-xs ${isTeam ? 'text-purple-500' : 'text-blue-500'}`}>
                            {isTeam ? 'Equipo PV' : 'Cliente'}
                          </span>
                        </button>
                      );
                    })}
                  {(teamMembers.length === 0 && projectMembers.length === 0) && (
                    <div className="px-3 py-2 text-sm text-apple-gray-400">No hay miembros disponibles</div>
                  )}
                </div>
              )}
            </div>
          )}
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
// CLIENT ACCESS MODAL - Con busqueda completa
// ============================================

const ClientAccessModal = ({ isOpen, onClose, project, onSave }) => {
  const [accesses, setAccesses] = useState([]);
  const [form, setForm] = useState({ email: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const toast = useToast();

  const loadAccesses = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/projects/${project.id}/client-access`);
      setAccesses(data || []);
    } catch (e) {
      toast.error('Error al cargar accesos');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadAccesses();
      setForm({ email: '', name: '' });
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (query, field) => {
    if (field === 'email') {
      setForm({ ...form, email: query });
    } else {
      setForm({ ...form, name: query });
    }
    
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setSearching(true);
    setShowDropdown(true);
    try {
      const results = await api.get(`/api/contacts/search?projectId=${project.id}&q=${encodeURIComponent(query)}`);
      setSearchResults(results || []);
    } catch (e) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const selectContact = (contact) => {
    setForm({
      email: contact.email,
      name: contact.name || ''
    });
    setSearchResults([]);
    setShowDropdown(false);
  };

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
    if (!confirm('Eliminar este acceso?')) return;
    
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
    <Modal isOpen={isOpen} onClose={onClose} title="Acceso cliente" size="large">
      <div className="space-y-6">
        {/* Create New Access with Search */}
        <div className="p-4 bg-apple-gray-50 rounded-xl">
          <h4 className="font-medium text-apple-gray-600 mb-3">Crear nuevo acceso</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Email field with search */}
            <div className="relative">
              <label className="block text-sm font-medium text-apple-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleSearch(e.target.value, 'email')}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Email del cliente"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full px-3 py-2 text-sm bg-white border border-apple-gray-200 rounded-lg focus:outline-none focus:border-apple-blue"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-apple-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {searchResults.map((person, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => selectContact(person)}
                      className="w-full px-3 py-2 text-left hover:bg-apple-gray-50 flex items-center gap-2"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-apple-gray-600">{person.name}</div>
                        <div className="text-xs text-apple-gray-400">{person.email}</div>
                      </div>
                      <span className="text-xs text-apple-gray-300">{person.source}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Name field with search */}
            <div className="relative">
              <label className="block text-sm font-medium text-apple-gray-500 mb-1">Nombre</label>
              <input
                value={form.name}
                onChange={e => handleSearch(e.target.value, 'name')}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Nombre (opcional)"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full px-3 py-2 text-sm bg-white border border-apple-gray-200 rounded-lg focus:outline-none focus:border-apple-blue"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-apple-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {searchResults.map((person, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => selectContact(person)}
                      className="w-full px-3 py-2 text-left hover:bg-apple-gray-50 flex items-center gap-2"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-apple-gray-600">{person.name}</div>
                        <div className="text-xs text-apple-gray-400">{person.email}</div>
                      </div>
                      <span className="text-xs text-apple-gray-300">{person.source}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating || !form.email}>
            {creating ? 'Creando...' : 'Crear y enviar email'}
          </Button>
        </div>
        
        {/* Portal URL */}
        <div className="p-4 bg-purple-50 rounded-xl">
          <h4 className="font-medium text-apple-gray-600 mb-2">URL del portal</h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm text-apple-gray-500 border">
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
          <h4 className="font-medium text-apple-gray-600 mb-3">Accesos existentes</h4>
          {loading ? (
            <div className="text-center py-4 text-apple-gray-400">Cargando...</div>
          ) : accesses.length === 0 ? (
            <div className="text-center py-4 text-apple-gray-400">No hay accesos creados</div>
          ) : (
            <div className="space-y-2">
              {accesses.map(a => (
                <div key={a.user_id} className="flex items-center gap-3 p-3 bg-apple-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Icon name="person" className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-apple-gray-600">{a.name || a.email}</div>
                    <div className="text-sm text-apple-gray-400">{a.email}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleResend(a.user_id)} 
                      className="p-2 hover:bg-apple-gray-200 rounded-lg" 
                      title="Reenviar email"
                    >
                      <Icon name="send" className="text-apple-gray-500 text-sm" />
                    </button>
                    <button 
                      onClick={() => handleDelete(a.user_id)} 
                      className="p-2 hover:bg-red-100 rounded-lg" 
                      title="Eliminar"
                    >
                      <Icon name="delete" className="text-apple-red text-sm" />
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Microsoft 365" size="large">
      {loading ? (
        <div className="text-center py-8 text-apple-gray-400">
          <div className="w-8 h-8 border-2 border-apple-gray-200 border-t-pv-purple rounded-full animate-spin mx-auto mb-2" />
          <div>Cargando datos de Microsoft 365...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SharePoint */}
          <div className={`p-4 rounded-xl ${project.sharepoint ? 'bg-green-50 border border-green-200' : 'bg-apple-gray-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <window.SharePointIcon className="w-6 h-6 text-teal-600" />
              <h4 className="font-medium text-apple-gray-600">SharePoint</h4>
              {project.sharepoint && <Badge color="green">Conectado</Badge>}
            </div>
            {project.sharepoint ? (
              <a href={project.sharepoint.folderUrl} target="_blank" rel="noopener" className="text-sm text-teal-600 hover:underline">
                Abrir carpeta en SharePoint
              </a>
            ) : (
              <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-apple-gray-200 rounded-lg">
                <option value="">Seleccionar sitio...</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
              </select>
            )}
          </div>
          
          {/* Teams */}
          <div className={`p-4 rounded-xl ${project.teams ? 'bg-green-50 border border-green-200' : 'bg-apple-gray-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <window.TeamsIcon className="w-6 h-6 text-purple-600" />
              <h4 className="font-medium text-apple-gray-600">Teams</h4>
              {project.teams && <Badge color="green">Conectado</Badge>}
            </div>
            {project.teams ? (
              <a href={project.teams.channelUrl} target="_blank" rel="noopener" className="text-sm text-purple-600 hover:underline">
                Abrir canal en Teams
              </a>
            ) : (
              <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-apple-gray-200 rounded-lg">
                <option value="">Seleccionar equipo...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
              </select>
            )}
          </div>
          
          {/* Planner */}
          <div className={`p-4 rounded-xl ${project.planner ? 'bg-green-50 border border-green-200' : 'bg-apple-gray-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <window.PlannerIcon className="w-6 h-6 text-green-600" />
              <h4 className="font-medium text-apple-gray-600">Planner</h4>
              {project.planner && <Badge color="green">Conectado</Badge>}
            </div>
            {project.planner ? (
              <span className="text-sm text-green-600">Plan: {project.planner.planTitle || project.planner.planId}</span>
            ) : (
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-apple-gray-200 rounded-lg">
                <option value="">Seleccionar grupo...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.displayName}</option>)}
              </select>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            {(!project.sharepoint || !project.teams || !project.planner) && (
              <Button onClick={handleSetup} disabled={saving || (!selectedSite && !selectedTeam && !selectedGroup)}>
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
