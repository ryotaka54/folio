'use client';

import { useTheme } from 'next-themes';
import { useEffect, useId, useState } from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ThemeToggle() {
  const id = useId();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-[72px] h-6" />;

  const isDark = theme === 'dark';

  return (
    <div
      className="group inline-flex items-center gap-2"
      data-state={isDark ? 'checked' : 'unchecked'}
    >
      <span
        id={`${id}-light`}
        className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-sm font-medium transition-colors"
        aria-controls={id}
        onClick={() => setTheme('light')}
        aria-label="Light mode"
      >
        <SunIcon className="size-4" aria-hidden="true" />
      </span>

      <Switch
        id={id}
        checked={isDark}
        onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
        aria-labelledby={`${id}-dark ${id}-light`}
        aria-label="Toggle between dark and light mode"
      />

      <span
        id={`${id}-dark`}
        className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-sm font-medium transition-colors"
        aria-controls={id}
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
      >
        <MoonIcon className="size-4" aria-hidden="true" />
      </span>
    </div>
  );
}
