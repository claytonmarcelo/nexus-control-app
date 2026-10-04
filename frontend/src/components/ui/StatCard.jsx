export default function StatCard({ title, value, icon, color = 'nexus', trend }) {
  const colorMap = {
    nexus: {
      accent: '#d4af37',
      bg: 'rgba(212, 175, 55, 0.08)',
      border: 'rgba(212, 175, 55, 0.2)',
      trendColor: '#d4af37',
    },
    green: {
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.2)',
      trendColor: '#10b981',
    },
    purple: {
      accent: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: 'rgba(139, 92, 246, 0.2)',
      trendColor: '#8b5cf6',
    },
    red: {
      accent: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
      trendColor: '#ef4444',
    },
    yellow: {
      accent: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.2)',
      trendColor: '#f59e0b',
    },
  };

  const c = colorMap[color] || colorMap.nexus;

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4 transition-all duration-250 relative overflow-hidden group"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.border;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `var(--shadow-md), 0 0 20px ${c.bg}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Decorative top stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-250"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-bold leading-none tracking-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </p>
          {trend && (
            <p
              className="text-xs mt-2 flex items-center gap-1 font-medium"
              style={{ color: c.trendColor }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {trend} este mês
            </p>
          )}
        </div>

        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            color: c.accent,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}