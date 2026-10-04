export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      {/* Icon Container with subtle gold glow */}
      <div
        className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative"
        style={{
          backgroundColor: 'var(--accent-gold-faint)',
          border: '1px solid var(--accent-gold-border)',
          boxShadow: '0 8px 24px rgba(212, 175, 55, 0.08)',
        }}
      >
        <div className="w-10 h-10" style={{ color: 'var(--accent-gold)' }}>
          {icon}
        </div>
      </div>
      
      {/* Title */}
      <h3
        className="text-lg font-bold mb-2 tracking-wide"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      
      {/* Description */}
      <p
        className="text-sm mb-8 max-w-md leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
      
      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2 shadow-lg"
          style={{ letterSpacing: '0.04em' }}
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}