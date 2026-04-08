interface ProLogoProps {
  size?: number;
  variant?: 'dark' | 'blue' | 'mono';
}

const GOLD = '#C9A84C';

export function ProLogo({ size = 32 }: ProLogoProps) {
  const id = 'pro-logo-clip';

  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={id}>
          <rect width="56" height="56" rx="13" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="56" height="56" rx="13" fill="#0a0a14" />

      {/* Signal line — white at 90% opacity */}
      <path
        d="M14 36 L22 26 L30 32 L38 20 L44 26"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Gold dot */}
      <circle cx="44" cy="26" r="4" fill={GOLD} />

      {/* Gold dashed vertical line */}
      <line
        x1="44" y1="34"
        x2="44" y2="44"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />

      {/* PRO badge — bottom-left corner */}
      <rect
        x="5" y="40"
        width="19" height="11"
        rx="3"
        fill={GOLD}
        fillOpacity="0.15"
      />
      <text
        x="14.5"
        y="49"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="6.5"
        letterSpacing="0.6"
        fill={GOLD}
      >
        PRO
      </text>
    </svg>
  );
}
