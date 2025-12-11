// ============================================
// PLAIN VANILLA ADMIN - COMPONENTS
// Diseño Apple-style: limpio, elegante, minimalista
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

// Microsoft Logo for login button
const MicrosoftLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 21 21" className={className}>
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

// ============================================
// UI COMPONENTS - Apple Style
// ============================================

// Card Container - Clean with subtle shadow
const Card = ({ children, className = "", onClick, hover = true }) => (
  <div 
    onClick={onClick} 
    className={`
      bg-white rounded-2xl 
      shadow-[0_2px_8px_rgba(0,0,0,0.04)] 
      border border-gray-100/80
      ${onClick && hover ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

// Button with Apple-style variants
const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "md", 
  disabled, 
  className = "", 
  type = "button",
  icon,
  loading
}) => {
  const base = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-r from-pv-pink to-pv-purple text-white
      hover:shadow-lg hover:shadow-pv-pink/25 hover:-translate-y-0.5
      focus:ring-pv-purple/50
      active:translate-y-0
    `,
    secondary: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200
      focus:ring-gray-300
    `,
    outline: `
      border border-gray-200 text-gray-700 bg-white
      hover:bg-gray-50 hover:border-gray-300
      focus:ring-gray-300
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25
      focus:ring-red-500/50
    `,
    ghost: `
      text-gray-600 bg-transparent
      hover:bg-gray-100
      focus:ring-gray-300
    `,
    soft: `
      bg-gradient-to-r from-pv-pink/10 to-pv-purple/10 
      text-pv-purple
      hover:from-pv-pink/20 hover:to-pv-purple/20
      focus:ring-pv-purple/30
    `
  };
  
  const sizes = { 
    sm: "px-3 py-1.5 text-sm", 
    md: "px-4 py-2.5 text-sm", 
    lg: "px-6 py-3 text-base" 
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled || loading} 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <Icon name={icon} className="text-lg" />
      ) : null}
      {children}
    </button>
  );
};

// Modal Dialog - Clean with blur backdrop
const Modal = ({ isOpen, onClose, title, children, size = "md", footer }) => {
  if (!isOpen) return null;
  
  const sizes = { 
    sm: "max-w-md", 
    md: "max-w-lg", 
    lg: "max-w-2xl", 
    xl: "max-w-4xl",
    full: "max-w-6xl"
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Modal container */}
      <div 
        className={`
          relative bg-white rounded-2xl shadow-2xl 
          w-full ${sizes[size]} 
          max-h-[90vh] overflow-hidden 
          flex flex-col
          animate-fadeInScale
        `} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        
        {/* Footer if provided */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Badge - Subtle and elegant
const Badge = ({ children, color = "gray", size = "md" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20",
    amber: "bg-amber-50 text-amber-600 ring-1 ring-amber-500/20",
    red: "bg-red-50 text-red-600 ring-1 ring-red-500/20",
    blue: "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20",
    purple: "bg-purple-50 text-purple-600 ring-1 ring-purple-500/20",
    pink: "bg-pink-50 text-pink-600 ring-1 ring-pink-500/20",
    teal: "bg-teal-50 text-teal-600 ring-1 ring-teal-500/20"
  };
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1 text-sm"
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colors[color]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

// Input Field - Clean Apple style
const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required, 
  error, 
  helper,
  icon,
  className = "", 
  ...props 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon name={icon} className="text-lg" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full px-4 py-2.5 
          ${icon ? 'pl-10' : ''}
          bg-gray-50 border border-gray-200 rounded-xl
          text-gray-900 placeholder-gray-400
          transition-all duration-200
          hover:border-gray-300
          focus:outline-none focus:bg-white focus:border-pv-purple focus:ring-4 focus:ring-pv-purple/10
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}
        `}
        {...props}
      />
    </div>
    {helper && !error && <p className="mt-1.5 text-sm text-gray-500">{helper}</p>}
    {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
  </div>
);

// Select Field
const Select = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder, 
  required, 
  className = "" 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`
        w-full px-4 py-2.5 
        bg-gray-50 border border-gray-200 rounded-xl
        text-gray-900
        transition-all duration-200
        hover:border-gray-300
        focus:outline-none focus:bg-white focus:border-pv-purple focus:ring-4 focus:ring-pv-purple/10
        appearance-none
        bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2224%22%20height%3d%2224%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]
        bg-[length:20px] bg-[right_12px_center] bg-no-repeat
      `}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Textarea
const Textarea = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  rows = 3, 
  required, 
  className = "" 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className={`
        w-full px-4 py-3 
        bg-gray-50 border border-gray-200 rounded-xl
        text-gray-900 placeholder-gray-400
        transition-all duration-200
        hover:border-gray-300
        focus:outline-none focus:bg-white focus:border-pv-purple focus:ring-4 focus:ring-pv-purple/10
        resize-none
      `}
    />
  </div>
);

// Loading Spinner
const Spinner = ({ size = "md", className = "" }) => {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div 
      className={`
        ${sizes[size]} 
        border-2 border-gray-200 border-t-pv-purple 
        rounded-full animate-spin 
        ${className}
      `} 
    />
  );
};

// Empty State - Elegant
const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-16">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
      <Icon name={icon} className="text-3xl text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>}
    {action}
  </div>
);

// Divider with optional label
const Divider = ({ label }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200" />
    </div>
    {label && (
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-white text-gray-500">{label}</span>
      </div>
    )}
  </div>
);

// Avatar
const Avatar = ({ name, size = "md", className = "" }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };
  
  return (
    <div 
      className={`
        ${sizes[size]}
        rounded-full bg-gradient-to-br from-pv-pink to-pv-purple
        flex items-center justify-center text-white font-semibold
        shadow-lg shadow-pv-purple/20
        ${className}
      `}
    >
      {name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
  );
};

// ============================================
// TOAST SYSTEM - Apple style notifications
// ============================================

const ToastContext = createContext();
const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  const toast = {
    success: m => addToast(m, 'success'),
    error: m => addToast(m, 'error'),
    info: m => addToast(m, 'info'),
    warning: m => addToast(m, 'warning')
  };
  
  const toastStyles = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };
  
  const toastIcons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 space-y-3 z-50">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`
              px-4 py-3 rounded-xl shadow-xl 
              text-white flex items-center gap-3
              animate-slideInRight
              ${toastStyles[t.type]}
            `}
          >
            <Icon name={toastIcons[t.type]} className="text-xl" />
            <span className="font-medium">{t.message}</span>
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
window.Divider = Divider;
window.Avatar = Avatar;
window.ToastContext = ToastContext;
window.ToastProvider = ToastProvider;
window.useToast = useToast;
