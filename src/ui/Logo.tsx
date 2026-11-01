/** The ThermoStat mark: a heat source with two rising heat lines, and the letter-spaced wordmark. */

export function LogoMark({ size = 28, title }: { size?: number; title?: string }) {
  return (
    <svg className="ts-logo-mark" width={size} height={size} viewBox="0 0 32 32" role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true} aria-label={title} focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="currentColor" opacity="0.08" />
      <path d="M9 17.5a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5 14a11 11 0 0 1 22 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      <circle cx="16" cy="22" r="4.2" fill="#d16b24" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`ts-wordmark-lockup ${className ?? ''}`}>
      <LogoMark />
      <span className="ts-wordmark-text">THERMOSTAT</span>
    </span>
  );
}
