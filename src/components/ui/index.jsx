// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', loading = false, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-body font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary:   'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500 shadow-sm',
    secondary: 'bg-surface-100 hover:bg-surface-200 text-surface-800 focus:ring-surface-300 border border-surface-200',
    danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost:     'hover:bg-surface-100 text-surface-800 focus:ring-surface-300',
    gold:      'bg-gold-500 hover:bg-gold-600 text-white focus:ring-gold-400 shadow-sm',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-6 py-2.5',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-surface-800 font-body">{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm font-body rounded-xl border bg-white
          ${error ? 'border-red-400 focus:ring-red-300' : 'border-surface-200 focus:ring-brand-300'}
          focus:outline-none focus:ring-2 focus:border-transparent transition-all
          placeholder:text-surface-200 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-surface-800 font-body">{label}</label>}
      <select
        className={`w-full px-3 py-2 text-sm font-body rounded-xl border border-surface-200 bg-white
          focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent
          transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-xl2 shadow-card border border-surface-100 ${className}`} {...props}>
      {children}
    </div>
  )
}

// ─── Badge / Status ───────────────────────────────────────────────────────────
export function Badge({ label, color }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body ${color}`}>
      {label}
    </span>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl3 shadow-modal w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="font-display font-semibold text-surface-900 text-lg">{title}</h3>
            <button onClick={onClose} className="text-surface-200 hover:text-surface-800 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ columns, data, emptyMessage = 'Nenhum registro encontrado.' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-100">
      <table className="w-full text-sm font-body">
        <thead>
          <tr className="bg-surface-50 border-b border-surface-100">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-xs font-semibold text-surface-800 uppercase tracking-wide whitespace-nowrap
                  ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-200 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                {columns.map((col, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 text-surface-800 ${col.align === 'right' ? 'text-right font-mono text-xs' : ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'brand', sub }) {
  const colors = {
    brand:   'bg-brand-50 text-brand-600',
    gold:    'bg-amber-50 text-amber-600',
    green:   'bg-emerald-50 text-emerald-600',
    red:     'bg-red-50 text-red-600',
  }
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-surface-200 font-body truncate">{label}</p>
        <p className="text-2xl font-display font-bold text-surface-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-surface-200 mt-1">{sub}</p>}
      </div>
    </Card>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-surface-200 mb-4">{icon}</div>
      <h3 className="font-display font-semibold text-surface-800 text-lg mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-200 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center p-8">
      <svg className={`animate-spin text-brand-600 ${sizes[size]}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  )
}

// ─── Section Title ────────────────────────────────────────────────────────────
export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display font-bold text-surface-900 text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-surface-200 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
