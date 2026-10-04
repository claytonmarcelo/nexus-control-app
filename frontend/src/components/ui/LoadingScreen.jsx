
export default function LoadingScreen() {
  return (
    <div
      className="flex flex-col justify-center items-center h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Logo + Spinner */}
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div
            className="absolute w-20 h-20 rounded-full animate-spin"
            style={{
              border: '1px solid transparent',
              borderTopColor: 'var(--accent-gold)',
              borderRightColor: 'var(--accent-gold-border)',
              animationDuration: '1.2s',
              animationTimingFunction: 'linear',
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute w-14 h-14 rounded-full animate-spin"
            style={{
              border: '1px solid transparent',
              borderBottomColor: 'var(--accent-gold-dark)',
              animationDuration: '0.9s',
              animationTimingFunction: 'linear',
              animationDirection: 'reverse',
            }}
          />
          {/* Logo center */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center z-10"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
              boxShadow: '0 0 20px rgba(212,175,55,0.25)',
            }}
          >
            <NexusLogo className="w-6 h-6" style={{ color: '#0d0d0d' }} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p
            className="text-sm font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}
          >
            Nexus Control
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Carregando...
          </p>
        </div>
      </div>
    </div>
  );
}

function NexusLogo({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nexusGradLoad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5C158" />
          <stop offset="100%" stopColor="#B8962E" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="4.5" fill="url(#nexusGradLoad)" />
      <line x1="24" y1="19.5" x2="24" y2="8" stroke="url(#nexusGradLoad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="7" r="2.5" fill="url(#nexusGradLoad)" />
      <line x1="24" y1="28.5" x2="24" y2="40" stroke="url(#nexusGradLoad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="41" r="2.5" fill="url(#nexusGradLoad)" />
      <line x1="27.9" y1="21.75" x2="36.5" y2="16.8" stroke="url(#nexusGradLoad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="37.9" cy="16" r="2.5" fill="url(#nexusGradLoad)" />
      <line x1="20.1" y1="26.25" x2="11.5" y2="31.2" stroke="url(#nexusGradLoad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10.1" cy="32" r="2.5" fill="url(#nexusGradLoad)" />
      <line x1="20.1" y1="21.75" x2="11.5" y2="16.8" stroke="url(#nexusGradLoad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10.1" cy="16" r="2.5" fill="url(#nexusGradLoad)" />
      <line x1="27.9" y1="26.25" x2="36.5" y2="31.2" stroke="url(#nexusGradLoad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="37.9" cy="32" r="2.5" fill="url(#nexusGradLoad)" />
    </svg>
  );
}