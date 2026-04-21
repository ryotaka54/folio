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

function twoInitials(name: string): string {
  const parts = name.split(/[\s./\-_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.trim().slice(0, 2)).toUpperCase() || '??';
}

export default function CompanyAvatar({ company, size = 32 }: CompanyAvatarProps) {
  const initials = twoInitials(company);
  const hue = stableHue(company);
  const radius = Math.round(size * 0.28);
  const fontSize = Math.round(size * 0.34);

  return (
    <div
      className="company-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        '--av-hue': hue,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        flexShrink: 0,
        userSelect: 'none',
      } as React.CSSProperties}
    >
      {initials}
    </div>
  );
}
