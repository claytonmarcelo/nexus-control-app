export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="py-12 px-6 text-center">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-dark-hover flex items-center justify-center mb-4 text-nexus-500/50">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-nexus-400 mb-6">{description}</p>
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