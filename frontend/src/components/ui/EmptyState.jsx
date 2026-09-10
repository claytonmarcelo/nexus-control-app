export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon Container */}
      <div className="mx-auto w-24 h-24 rounded-2xl bg-dark-hover border border-dark-border flex items-center justify-center mb-6 text-nexus-500/50">
        <div className="w-12 h-12">
          {icon}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      
      {/* Description */}
      <p className="text-nexus-400 text-sm mb-8 max-w-sm">{description}</p>
      
      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}