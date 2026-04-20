'use client';

const CATEGORY_HUE: Record<string, number> = {
  'Engineering':        250,
  'Product':            310,
  'Product Management': 310,
  'Data':               175,
  'Design':              20,
  'Finance':            140,
  'Consulting':          60,
  'Marketing':           30,
  'Operations':         200,
  'Research':           280,
};

interface CategoryTagProps {
  category: string;
}

export default function CategoryTag({ category }: CategoryTagProps) {
  const hue = CATEGORY_HUE[category] ?? 260;
  return (
    <span style={{
      padding: '2px 7px',
      borderRadius: 5,
      fontSize: 11,
      fontWeight: 500,
      color: `light-dark(oklch(0.45 0.13 ${hue}), oklch(0.82 0.10 ${hue}))`,
      background: `light-dark(oklch(0.96 0.025 ${hue}), oklch(0.30 0.06 ${hue}))`,
      whiteSpace: 'nowrap' as const,
    }}>
      {category}
    </span>
  );
}
