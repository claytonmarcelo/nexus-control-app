export default function StatCard({ title, value, icon, color = 'nexus', trend }) {
  const colors = {
    nexus: 'bg-nexus-600/20 text-nexus-400 border-nexus-500/30',
    green: 'bg-green-600/20 text-green-400 border-green-500/30',
    purple: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-600/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <div className={`card p-6 border ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-nexus-300 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {trend} vs mês anterior
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color].replace('bg-', 'bg-').replace('text-', 'bg-').replace('border-', 'bg-')} opacity-90`}>
          {icon}
        </div>
      </div>
    </div>
  );
}