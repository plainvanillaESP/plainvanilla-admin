// ============================================
// PLAIN VANILLA ADMIN - API & UTILITIES
// Helper de API y funciones de utilidad
// ============================================

// ============================================
// API HELPER
// ============================================

const api = {
  get: async (url) => {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: 'Error de conexiÃ³n' }));
      throw error;
    }
    return r.json();
  },
  
  post: async (url, data) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: 'Error de conexiÃ³n' }));
      throw error;
    }
    return r.json();
  },
  
  put: async (url, data) => {
    const r = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: 'Error de conexiÃ³n' }));
      throw error;
    }
    return r.json();
  },
  
  delete: async (url) => {
    const r = await fetch(url, { method: 'DELETE', credentials: 'include' });
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: 'Error de conexiÃ³n' }));
      throw error;
    }
    return r.json();
  }
};

// ============================================
// DATE UTILITIES
// ============================================

// Format date to Spanish locale
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

// Format date short (DD/MM)
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit'
  });
};

// Format time (HH:MM)
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return timeStr.substring(0, 5);
};

// Get relative date (hoy, maÃ±ana, hace 2 dÃ­as, etc)
const getRelativeDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'MaÃ±ana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays > 1 && diffDays <= 7) return `En ${diffDays} dÃ­as`;
  if (diffDays < -1 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} dÃ­as`;
  return formatDate(dateStr);
};

// Minimum date (1 year ago)
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
const minDateStr = oneYearAgo.toISOString().split('T')[0];

// Today's date string
const todayStr = new Date().toISOString().split('T')[0];

// ============================================
// CURRENCY UTILITIES
// ============================================

// Format currency (EUR)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount || 0);
};

// Format number with thousands separator
const formatNumber = (num) => {
  return new Intl.NumberFormat('es-ES').format(num || 0);
};

// ============================================
// PROJECT UTILITIES
// ============================================

// Calculate project dates from phases, sessions, tasks
const getProjectDates = (project) => {
  const dates = [];
  
  (project.phases || []).forEach(p => {
    if (p.startDate) dates.push(p.startDate);
    if (p.endDate) dates.push(p.endDate);
  });
  
  (project.sessions || []).forEach(s => {
    if (s.date) dates.push(s.date);
  });
  
  (project.tasks || []).forEach(t => {
    if (t.dueDate) dates.push(t.dueDate);
  });
  
  if (dates.length === 0) return { start: null, end: null };
  
  dates.sort();
  return { start: dates[0], end: dates[dates.length - 1] };
};

// Calculate project revenue with VAT
const calculateProjectRevenue = (project) => {
  const pricing = project.pricing || { basePrice: 0, vatExempt: false, vatRate: 21 };
  const addOns = project.addOns || [];
  
  const base = parseFloat(pricing.basePrice) || 0;
  const addOnsTotal = addOns.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
  const subtotal = base + addOnsTotal;
  const vatAmount = pricing.vatExempt ? 0 : subtotal * ((pricing.vatRate || 21) / 100);
  
  return { 
    base,
    addOnsTotal,
    subtotal, 
    vatAmount, 
    total: subtotal + vatAmount 
  };
};

// ============================================
// SESSION UTILITIES
// ============================================

// Get session status based on date/time
const getSessionStatus = (session) => {
  if (!session.date || !session.time) return 'todo';
  
  const now = new Date();
  const sessionStart = new Date(session.date + 'T' + session.time);
  const sessionEnd = new Date(sessionStart.getTime() + (session.duration || 60) * 60 * 1000);
  
  if (now < sessionStart) return 'todo';
  if (now >= sessionStart && now <= sessionEnd) return 'doing';
  return 'done';
};

// Get session status color
const getSessionStatusColor = (status) => {
  const colors = {
    todo: 'gray',
    doing: 'amber',
    done: 'green'
  };
  return colors[status] || 'gray';
};

// ============================================
// PHASE UTILITIES
// ============================================

// Phase colors (rotating)
const phaseColors = [
  'bg-purple-200', 'bg-blue-200', 'bg-green-200', 'bg-amber-200', 
  'bg-pink-200', 'bg-teal-200', 'bg-indigo-200', 'bg-red-200'
];

const phaseTextColors = [
  'text-purple-700', 'text-blue-700', 'text-green-700', 'text-amber-700', 
  'text-pink-700', 'text-teal-700', 'text-indigo-700', 'text-red-700'
];

const phaseBorderColors = [
  'border-purple-300', 'border-blue-300', 'border-green-300', 'border-amber-300', 
  'border-pink-300', 'border-teal-300', 'border-indigo-300', 'border-red-300'
];

// Get phase color by index
const getPhaseColor = (index) => phaseColors[index % phaseColors.length];
const getPhaseTextColor = (index) => phaseTextColors[index % phaseTextColors.length];
const getPhaseBorderColor = (index) => phaseBorderColors[index % phaseBorderColors.length];

// Calculate phase progress
const getPhaseProgress = (phaseId, sessions, tasks) => {
  const phaseSessions = sessions.filter(s => s.phaseId === phaseId);
  const phaseTasks = tasks.filter(t => t.phaseId === phaseId);
  const total = phaseSessions.length + phaseTasks.length;
  
  if (total === 0) return 0;
  
  const completedSessions = phaseSessions.filter(s => getSessionStatus(s) === 'done').length;
  const completedTasks = phaseTasks.filter(t => t.status === 'completed').length;
  
  return Math.round(((completedSessions + completedTasks) / total) * 100);
};

// Calculate phase status automatically
const calculatePhaseStatus = (phaseId, sessions, tasks) => {
  const phaseSessions = sessions.filter(s => s.phaseId === phaseId);
  const phaseTasks = tasks.filter(t => t.phaseId === phaseId);
  
  if (phaseSessions.length === 0 && phaseTasks.length === 0) return 'pending';
  
  const allSessionsDone = phaseSessions.every(s => getSessionStatus(s) === 'done');
  const allTasksCompleted = phaseTasks.every(t => t.status === 'completed');
  const anySessionDoing = phaseSessions.some(s => getSessionStatus(s) === 'doing');
  const anyTaskInProgress = phaseTasks.some(t => t.status === 'in_progress');
  
  if (allSessionsDone && allTasksCompleted) return 'completed';
  if (anySessionDoing || anyTaskInProgress) return 'active';
  
  // Check if any session or task has started
  const anySessionDone = phaseSessions.some(s => getSessionStatus(s) === 'done');
  const anyTaskDone = phaseTasks.some(t => t.status === 'completed');
  
  if (anySessionDone || anyTaskDone) return 'active';
  
  return 'pending';
};

// ============================================
// TASK UTILITIES
// ============================================

// Get task priority color
const getTaskPriorityColor = (priority) => {
  const colors = {
    low: 'green',
    medium: 'amber',
    high: 'red'
  };
  return colors[priority] || 'gray';
};

// Get task status color
const getTaskStatusColor = (status) => {
  const colors = {
    pending: 'gray',
    in_progress: 'amber',
    completed: 'green'
  };
  return colors[status] || 'gray';
};

// ============================================
// VALIDATION UTILITIES
// ============================================

// Validate date is not more than 1 year in the past
const validateDateNotTooOld = (dateStr) => {
  if (!dateStr) return true;
  return new Date(dateStr) >= oneYearAgo;
};

// Validate end date is after start date
const validateEndAfterStart = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(endDate) >= new Date(startDate);
};

// Validate email format
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// ============================================
// URL UTILITIES
// ============================================

// Generate slug from text
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[Ã¡Ã Ã¤Ã¢]/g, 'a')
    .replace(/[Ã©Ã¨Ã«Ãª]/g, 'e')
    .replace(/[Ã­Ã¬Ã¯Ã®]/g, 'i')
    .replace(/[Ã³Ã²Ã¶Ã´]/g, 'o')
    .replace(/[ÃºÃ¹Ã¼Ã»]/g, 'u')
    .replace(/Ã±/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// ============================================
// EXPORT TO WINDOW
// ============================================

window.api = api;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.formatTime = formatTime;
window.getRelativeDate = getRelativeDate;
window.minDateStr = minDateStr;
window.todayStr = todayStr;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.getProjectDates = getProjectDates;
window.calculateProjectRevenue = calculateProjectRevenue;
window.getSessionStatus = getSessionStatus;
window.getSessionStatusColor = getSessionStatusColor;
window.phaseColors = phaseColors;
window.phaseTextColors = phaseTextColors;
window.phaseBorderColors = phaseBorderColors;
window.getPhaseColor = getPhaseColor;
window.getPhaseTextColor = getPhaseTextColor;
window.getPhaseBorderColor = getPhaseBorderColor;
window.getPhaseProgress = getPhaseProgress;
window.calculatePhaseStatus = calculatePhaseStatus;
window.getTaskPriorityColor = getTaskPriorityColor;
window.getTaskStatusColor = getTaskStatusColor;
window.validateDateNotTooOld = validateDateNotTooOld;
window.validateEndAfterStart = validateEndAfterStart;
window.validateEmail = validateEmail;
window.generateSlug = generateSlug;
