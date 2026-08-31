interface LogoProps {
  size?: number;
  variant?: 'dark' | 'blue' | 'mono';
}

export function Logo({ size = 32, variant = 'dark' }: LogoProps) {
  // 'dark' is a fixed near-black mark (header/nav badge) — a literal, not
  // var(--brand-navy), since that token flips to near-white in dark mode and
  // would invert this always-dark badge. Matches the new palette's ink
  // (light-mode --brand-navy / --body-text: #1B1A1E in globals.css).
  const bg = variant === 'dark' ? '#1B1A1E' : variant === 'blue' ? 'var(--accent-blue)' : 'none';
  const lineColor = variant === 'mono' ? 'var(--accent-blue)' : 'white';
  const dotColor = variant === 'dark' ? 'var(--accent-blue)' : variant === 'blue' ? 'white' : 'var(--accent-blue)';
  const rx = variant === 'mono' ? 0 : 13;

  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {variant !== 'mono' && <rect width="56" height="56" rx={rx} fill={bg} />}
      <path d="M14 36 L22 26 L30 32 L38 20 L44 26" stroke={lineColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="44" cy="26" r="4" fill={dotColor} />
      <line x1="44" y1="34" x2="44" y2="44" stroke={dotColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 3" />
    </svg>
  );
}
