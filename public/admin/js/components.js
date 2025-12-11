// ============================================
// PLAIN VANILLA ADMIN - COMPONENTS
// Componentes base reutilizables
// ============================================

const { useState, useContext, createContext } = React;

// ============================================
// ICONS
// ============================================

const Icon = ({ name, className = "" }) => (
  <span className={`material-icons-outlined ${className}`}>{name}</span>
);

// Logo Plain Vanilla - Estrella de 4 puntas
const Logo = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 211.98 211.98" className={className}>
    <defs>
      <linearGradient id="pvGrad" x1="0" y1="105.99" x2="211.98" y2="105.99">
        <stop offset="0" stopColor="#e6007e"/>
        <stop offset="1" stopColor="#8b37ed"/>
      </linearGradient>
    </defs>
    <path fill="url(#pvGrad)" d="M56.43,105.99c21.77-10.17,39.38-27.79,49.56-49.56,10.18,21.77,27.79,39.38,49.56,49.56-21.77,10.18-39.39,27.79-49.56,49.56-10.18-21.77-27.79-39.39-49.56-49.56ZM211.98,92.84C163.57,86.86,125.12,48.41,119.14,0c48.4,5.97,86.86,44.43,92.83,92.83ZM92.84,0C86.87,48.41,48.41,86.87,0,92.84,5.97,44.43,44.43,5.97,92.84,0ZM0,119.15c48.4,5.98,86.86,44.43,92.83,92.83C44.43,206,5.98,167.55,0,119.15ZM119.14,211.98c5.97-48.41,44.43-86.87,92.84-92.84-5.97,48.41-44.43,86.87-92.84,92.84Z"/>
  </svg>
);

// Microsoft Teams Icon
const TeamsIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.19 8.77c.34 0 .62.28.62.62v5.12c0 1.88-1.53 3.41-3.41 3.41h-1.19c-.82 0-1.57-.3-2.16-.78.02-.1.03-.2.03-.3V9.39c0-.34.28-.62.62-.62h5.49zm-3.84-4.17c1.13 0 2.05.92 2.05 2.05s-.92 2.05-2.05 2.05-2.05-.92-2.05-2.05.92-2.05 2.05-2.05z"/>
    <path d="M16.4 9.39v7.45c0 .1-.01.2-.03.3-.59.48-1.34.78-2.16.78H6.3c-1.88 0-3.41-1.53-3.41-3.41V9.39c0-.34.28-.62.62-.62h12.27c.34 0 .62.28.62.62zM9.71 4.6c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5z"/>
  </svg>
);

// SharePoint Icon
const SharePointIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="9" cy="8" r="5" opacity="0.9"/>
    <circle cx="16" cy="11" r="4" opacity="0.7"/>
    <circle cx="10" cy="16" r="4" opacity="0.5"/>
  </svg>
);

// Planner Icon
const PlannerIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

// ============================================
// UI COMPONENTS
// ============================================

// Card Container
const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
  >
    {children}
  </div>
);

// Button with variants
const Button = ({ children, onClick, variant = "primary", size = "md", disabled, className = "", type = "button" }) => {
  const base = "rounded-xl font-medium transition-all flex items-center gap-2 justify-center";
  const variants = {
    primary: "gradient-bg text-white hover:opacity-90",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    outline: "border-2 border-gray-200 text-gray-700 hover:border-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "text-gray-600 hover:bg-gray-100"
  };
  const sizes = { 
    sm: "px-3 py-1.5 text-sm", 
    md: "px-4 py-2", 
    lg: "px-6 py-3 text-lg" 
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled} 
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Modal Dialog
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  
  const sizes = { 
    sm: "max-w-md", 
    md: "max-w-lg", 
    lg: "max-w-2xl", 
    xl: "max-w-4xl" 
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <Icon name="close" className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// Badge / Tag
const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700",
    teal: "bg-teal-100 text-teal-700"
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

// Input Field
const Input = ({ label, type = "text", value, onChange, placeholder, required, error, className = "", ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pv-purple/20 ${error ? 'border-red-300' : 'border-gray-200'}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

// Select Field
const Select = ({ label, value, onChange, options, placeholder, required, className = "" }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pv-purple/20"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Textarea
const Textarea = ({ label, value, onChange, placeholder, rows = 3, required, className = "" }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pv-purple/20 resize-none"
    />
  </div>
);

// Loading Spinner
const Spinner = ({ size = "md", className = "" }) => {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div className={`${sizes[size]} border-2 border-gray-200 border-t-pv-purple rounded-full animate-spin ${className}`} />
  );
};

// Empty State
const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    <Icon name={icon} className="text-5xl text-gray-300 mb-3" />
    <h3 className="text-lg font-medium text-gray-600 mb-1">{title}</h3>
    {description && <p className="text-gray-400 mb-4">{description}</p>}
    {action}
  </div>
);

// ============================================
// TOAST SYSTEM
// ============================================

const ToastContext = createContext();
const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  
  const toast = {
    success: m => addToast(m, 'success'),
    error: m => addToast(m, 'error'),
    info: m => addToast(m, 'info'),
    warning: m => addToast(m, 'warning')
  };
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 toast-enter ${
              t.type === 'success' ? 'bg-green-500' : 
              t.type === 'error' ? 'bg-red-500' : 
              t.type === 'warning' ? 'bg-amber-500' :
              'bg-blue-500'
            }`}
          >
            <Icon 
              name={
                t.type === 'success' ? 'check_circle' : 
                t.type === 'error' ? 'error' : 
                t.type === 'warning' ? 'warning' :
                'info'
              } 
              className="text-lg" 
            />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ============================================
// EXPORT TO WINDOW
// ============================================

window.Icon = Icon;
window.Logo = Logo;
window.TeamsIcon = TeamsIcon;
window.SharePointIcon = SharePointIcon;
window.PlannerIcon = PlannerIcon;
window.Card = Card;
window.Button = Button;
window.Modal = Modal;
window.Badge = Badge;
window.Input = Input;
window.Select = Select;
window.Textarea = Textarea;
window.Spinner = Spinner;
window.EmptyState = EmptyState;
window.ToastContext = ToastContext;
window.ToastProvider = ToastProvider;
window.useToast = useToast;
