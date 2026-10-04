export default function NexusLogo({ className = 'w-6 h-6', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Nexus Control">
      <defs>
        <linearGradient id="nexusGradMain" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5D77F" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#997517" />
        </linearGradient>
        <filter id="nexusGlowMain" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer ring */}
      <circle cx="24" cy="24" r="21" stroke="url(#nexusGradMain)" strokeWidth="1.75" strokeOpacity="0.55" fill="none" />
      {/* Central hub */}
      <circle cx="24" cy="24" r="4.5" fill="url(#nexusGradMain)" filter="url(#nexusGlowMain)" />
      {/* Top */}
      <line x1="24" y1="19.5" x2="24" y2="8" stroke="url(#nexusGradMain)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="24" cy="7" r="2.5" fill="url(#nexusGradMain)" />
      {/* Bottom */}
      <line x1="24" y1="28.5" x2="24" y2="40" stroke="url(#nexusGradMain)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="24" cy="41" r="2.5" fill="url(#nexusGradMain)" />
      {/* Top-Right */}
      <line x1="27.9" y1="21.75" x2="36.5" y2="16.8" stroke="url(#nexusGradMain)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="37.9" cy="16" r="2.5" fill="url(#nexusGradMain)" />
      {/* Bottom-Left */}
      <line x1="20.1" y1="26.25" x2="11.5" y2="31.2" stroke="url(#nexusGradMain)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10.1" cy="32" r="2.5" fill="url(#nexusGradMain)" />
      {/* Top-Left */}
      <line x1="20.1" y1="21.75" x2="11.5" y2="16.8" stroke="url(#nexusGradMain)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10.1" cy="16" r="2.5" fill="url(#nexusGradMain)" />
      {/* Bottom-Right */}
      <line x1="27.9" y1="26.25" x2="36.5" y2="31.2" stroke="url(#nexusGradMain)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="37.9" cy="32" r="2.5" fill="url(#nexusGradMain)" />
    </svg>
  );
}
