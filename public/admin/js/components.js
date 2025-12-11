// ============================================
// PLAIN VANILLA - COMPONENTS
// Apple-style: minimal, clean, elegant
// ============================================

const { useState, useContext, createContext } = React;

// ============================================
// ICONS
// ============================================

const Icon = ({ name, className = "" }) => (
  <span className={`material-icons-outlined ${className}`} style={{ fontSize: 'inherit' }}>{name}</span>
);

const Logo = ({ className = "w-8 h-8" }) => (
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

const TeamsIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.19 8.77c.34 0 .62.28.62.62v5.12c0 1.88-1.53 3.41-3.41 3.41h-1.19c-.82 0-1.57-.3-2.16-.78.02-.1.03-.2.03-.3V9.39c0-.34.28-.62.62-.62h5.49zm-3.84-4.17c1.13 0 2.05.92 2.05 2.05s-.92 2.05-2.05 2.05-2.05-.92-2.05-2.05.92-2.05 2.05-2.05z"/>
    <path d="M16.4 9.39v7.45c0 .1-.01.2-.03.3-.59.48-1.34.78-2.16.78H6.3c-1.88 0-3.41-1.53-3.41-3.41V9.39c0-.34.28-.62.62-.62h12.27c.34 0 .62.28.62.62zM9.71 4.6c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5z"/>
  </svg>
);

const SharePointIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="9" cy="8" r="5" opacity="0.9"/>
    <circle cx="16" cy="11" r="4" opacity="0.7"/>
    <circle cx="10" cy="16" r="4" opacity="0.5"/>
  </svg>
);

const PlannerIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const MicrosoftLogo = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 21 21" className={className}>
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

// ============================================
// CARD - Apple style: minimal shadow, no border
// ============================================

const Card = ({ children, className = "", onClick, padding = true }) => (
  <div 
    onClick={onClick} 
    className={`
      bg-white rounded-2xl
      shadow-[0_1px_3px_rgba(0,0,0,0.04)]
      ${onClick ? 'cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200' : ''}
      ${padding ? 'p-6' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

// ============================================
// BUTTON - Apple style: subtle, minimal
// ============================================

const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "default", 
  disabled, 
  className = "", 
  type = "button",
  loading
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "pv-gradient text-white hover:opacity-90 active:opacity-80",
    secondary: "bg-apple-gray-100 text-apple-gray-600 hover:bg-apple-gray-200 active:bg-apple-gray-300",
    ghost: "text-apple-gray-500 hover:text-apple-gray-600 hover:bg-apple-gray-100 active:bg-apple-gray-200",
    danger: "bg-apple-red text-white hover:opacity-90",
    link: "text-apple-blue hover:text-apple-blue/80 p-0"
  };
  
  const sizes = {
    small: "text-xs px-3 py-1.5",
    default: "text-sm px-4 py-2",
    large: "text-sm px-5 py-2.5"
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${variant !== 'link' ? sizes[size] : ''} ${className}`}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

// ============================================
// MODAL - Apple style: clean, centered
// ============================================

const Modal = ({ isOpen, onClose, title, children, size = "default", footer }) => {
  if (!isOpen) return null;
  
  const sizes = {
    small: "max-w-md",
    default: "max-w-lg", 
    large: "max-w-2xl",
    xlarge: "max-w-4xl"
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[85vh] flex flex-col animate-scaleIn`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-apple-gray-100">
          <h2 className="text-base font-semibold text-apple-gray-600">{title}</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-apple-gray-100 transition-colors text-apple-gray-400 hover:text-apple-gray-600"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-apple-gray-100 flex justify-end gap-3 bg-apple-gray-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// BADGE - Apple style: subtle colors
// ============================================

const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray: "bg-apple-gray-100 text-apple-gray-500",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    pink: "bg-pink-50 text-pink-600",
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

// ============================================
// INPUT - Apple style: minimal, clean
// ============================================

const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required, 
  error,
  className = "",
  ...props 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-xs font-medium text-apple-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-apple-red ml-0.5">*</span>}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`
        w-full px-3 py-2 text-sm
        bg-apple-gray-50 border border-apple-gray-200 rounded-lg
        placeholder-apple-gray-400 text-apple-gray-600
        focus:outline-none focus:bg-white focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20
        transition-all duration-150
        ${error ? 'border-apple-red' : ''}
      `}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-apple-red">{error}</p>}
  </div>
);

// ============================================
// SELECT - Apple style
// ============================================

const Select = ({ label, value, onChange, options, placeholder, required, className = "" }) => (
  <div className={className}>
    {label && (
      <label className="block text-xs font-medium text-apple-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-apple-red ml-0.5">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`
        w-full px-3 py-2 text-sm
        bg-apple-gray-50 border border-apple-gray-200 rounded-lg
        text-apple-gray-600
        focus:outline-none focus:bg-white focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20
        transition-all duration-150
        appearance-none cursor-pointer
        bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2220%22%20height%3d%2220%22%20viewBox%3d%220%200%2020%2020%22%20fill%3d%22%2386868b%22%3e%3cpath%20d%3d%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%2f%3e%3c%2fsvg%3e')]
        bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-9
      `}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// ============================================
// TEXTAREA - Apple style
// ============================================

const Textarea = ({ label, value, onChange, placeholder, rows = 3, required, className = "" }) => (
  <div className={className}>
    {label && (
      <label className="block text-xs font-medium text-apple-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-apple-red ml-0.5">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className={`
        w-full px-3 py-2 text-sm
        bg-apple-gray-50 border border-apple-gray-200 rounded-lg
        placeholder-apple-gray-400 text-apple-gray-600
        focus:outline-none focus:bg-white focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20
        transition-all duration-150 resize-none
      `}
    />
  </div>
);

// ============================================
// SPINNER - Apple style
// ============================================

const Spinner = ({ size = "default" }) => {
  const sizes = { small: "w-4 h-4", default: "w-6 h-6", large: "w-8 h-8" };
  return (
    <div className={`${sizes[size]} border-2 border-apple-gray-200 border-t-pv-purple rounded-full animate-spin`} />
  );
};

// ============================================
// EMPTY STATE
// ============================================

const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-12 h-12 bg-apple-gray-100 rounded-full mb-4">
      <Icon name={icon} className="text-2xl text-apple-gray-400" />
    </div>
    <h3 className="text-sm font-medium text-apple-gray-600 mb-1">{title}</h3>
    {description && <p className="text-sm text-apple-gray-400 mb-4">{description}</p>}
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
  };
  
  const styles = {
    success: 'bg-apple-green',
    error: 'bg-apple-red',
    info: 'bg-apple-gray-600'
  };
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-slideUp ${styles[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ============================================
// EXPORTS
// ============================================

window.Icon = Icon;
window.Logo = Logo;
window.TeamsIcon = TeamsIcon;
window.SharePointIcon = SharePointIcon;
window.PlannerIcon = PlannerIcon;
window.MicrosoftLogo = MicrosoftLogo;
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
