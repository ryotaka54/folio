'use client';

interface CompanyAvatarProps {
  company: string;
  size?: number;
}

function stableHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

export default function CompanyAvatar({ company, size = 32 }: CompanyAvatarProps) {
  const initial = company.trim().charAt(0).toUpperCase() || '?';
  const hue = stableHue(company);
  const radius = Math.round(size * 0.28);
  const fontSize = Math.round(size * 0.40);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `light-dark(oklch(0.94 0.05 ${hue}), oklch(0.32 0.09 ${hue}))`,
        color: `light-dark(oklch(0.42 0.18 ${hue}), oklch(0.88 0.14 ${hue}))`,
        boxShadow: `inset 0 0 0 1px light-dark(oklch(0.86 0.07 ${hue}), oklch(0.44 0.11 ${hue}))`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
}
