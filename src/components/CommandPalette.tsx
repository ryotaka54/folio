'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import { Search, Plus, User, LogOut, Moon, Sun, ArrowRight } from 'lucide-react';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!user) return null; // Only show for logged in users

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm shadow-2xl modal-enter"
          style={{ opacity: 1, animation: 'fadeIn 0.15s ease-out' }}
        >
          <div className="w-full max-w-lg bg-card-bg rounded-2xl overflow-hidden border border-border-gray/50 shadow-2xl flex flex-col relative cmdk-container">
            <Command
              label="Global Command Menu"
              filter={(value, search) => {
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
              }}
            >
              <div className="flex items-center border-b border-border-gray px-4" cmdk-input-wrapper="">
                <Search size={18} className="text-muted-text mr-3" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command or search..."
                  className="w-full bg-transparent py-4 text-[15px] text-body-text focus:outline-none placeholder:text-muted-text/60"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setOpen(false);
                    }
                  }}
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide overscroll-contain">
                <Command.Empty className="py-6 text-center text-sm text-muted-text">
                  No commands found.
                </Command.Empty>

                <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-medium text-muted-text mb-1">
                  <Command.Item
                    onSelect={() => { setOpen(false); router.push('/dashboard'); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-navy rounded-lg cursor-pointer aria-selected:bg-surface-gray aria-selected:text-accent-blue transition-colors"
                  >
                    <div className="bg-surface-gray p-1.5 rounded-md text-muted-text"><ArrowRight size={14} /></div>
                    Go to Dashboard
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings & Appearance" className="px-2 pt-3 pb-1.5 text-xs font-medium text-muted-text mb-1 border-t border-border-gray opacity-80">
                  <Command.Item
                    onSelect={() => { setOpen(false); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-navy rounded-lg cursor-pointer aria-selected:bg-surface-gray transition-colors"
                  >
                    <div className="bg-surface-gray p-1.5 rounded-md text-muted-text">
                      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    </div>
                    Toggle Dark Mode
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { router.push('/onboarding'); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-navy rounded-lg cursor-pointer aria-selected:bg-surface-gray transition-colors"
                  >
                    <div className="bg-surface-gray p-1.5 rounded-md text-muted-text"><User size={14} /></div>
                    Change User Track (Job / Internship)
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Session" className="px-2 pt-3 pb-1.5 text-xs font-medium text-muted-text mb-1 border-t border-border-gray opacity-80">
                  <Command.Item
                    onSelect={async () => {
                      setOpen(false);
                      await signOut();
                      router.push('/login');
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 rounded-lg cursor-pointer aria-selected:bg-red-50 aria-selected:text-red-600 transition-colors"
                  >
                    <div className="bg-red-50 p-1.5 rounded-md text-red-500"><LogOut size={14} /></div>
                    Log Out
                  </Command.Item>
                </Command.Group>

              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
