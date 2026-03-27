interface LogoProps {
  size?: number;
  variant?: 'dark' | 'blue' | 'mono';
}

export function Logo({ size = 32, variant = 'dark' }: LogoProps) {
  const bg = variant === 'dark' ? '#111827' : variant === 'blue' ? '#2563EB' : 'none';
  const lineColor = variant === 'mono' ? '#2563EB' : 'white';
  const dotColor = variant === 'dark' ? '#2563EB' : variant === 'blue' ? 'white' : '#2563EB';
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
