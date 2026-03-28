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

  if (!user) return null;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm modal-enter"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg overflow-hidden border border-border-gray shadow-lg flex flex-col relative cmdk-container"
            style={{ background: 'var(--card-bg)' }}
            onClick={e => e.stopPropagation()}
          >
            <Command
              label="Global Command Menu"
              filter={(value, search) => {
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
              }}
            >
              <div className="flex items-center border-b border-border-gray px-4" cmdk-input-wrapper="">
                <Search size={16} className="text-muted-text mr-3 flex-shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command or search…"
                  className="w-full bg-transparent py-3.5 text-[14px] text-body-text focus:outline-none placeholder:text-muted-text/60"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false);
                  }}
                />
                <kbd className="hidden sm:flex text-[10px] font-medium px-1.5 py-0.5 rounded border ml-2 flex-shrink-0" style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--text-tertiary)' }}>
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[320px] overflow-y-auto p-2 scrollbar-hide overscroll-contain">
                <Command.Empty className="py-6 text-center text-[13px] text-muted-text">
                  No commands found.
                </Command.Empty>

                <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-text mb-1">
                  <Command.Item
                      value="add application new"
                      onSelect={() => { setOpen(false); document.dispatchEvent(new CustomEvent('applyd:add')); }}
                      className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-md cursor-pointer aria-selected:bg-surface-gray transition-colors"
                      style={{ color: 'var(--brand-navy)' }}
                    >
                      <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: 'var(--surface-gray)', color: 'var(--accent-blue)' }}>
                        <Plus size={13} />
                      </div>
                      Add Application
                      <kbd className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border hidden sm:block" style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--text-tertiary)' }}>
                        N
                      </kbd>
                    </Command.Item>
                  <Command.Item
                    value="go dashboard"
                    onSelect={() => { setOpen(false); router.push('/dashboard'); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-md cursor-pointer aria-selected:bg-surface-gray transition-colors"
                    style={{ color: 'var(--brand-navy)' }}
                  >
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                      <ArrowRight size={13} />
                    </div>
                    Go to Dashboard
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings & Appearance" className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-text mb-1 border-t border-border-gray">
                  <Command.Item
                    value="toggle dark mode theme"
                    onSelect={() => { setOpen(false); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-md cursor-pointer aria-selected:bg-surface-gray transition-colors"
                    style={{ color: 'var(--brand-navy)' }}
                  >
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                      {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                    </div>
                    {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </Command.Item>
                  <Command.Item
                    value="change user track job internship mode"
                    onSelect={() => { router.push('/onboarding?change=true'); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-md cursor-pointer aria-selected:bg-surface-gray transition-colors"
                    style={{ color: 'var(--brand-navy)' }}
                  >
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                      <User size={13} />
                    </div>
                    Change Track (Job / Internship)
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Session" className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-text mb-1 border-t border-border-gray">
                  <Command.Item
                    value="log out sign out"
                    onSelect={async () => {
                      setOpen(false);
                      await signOut();
                      router.push('/login');
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-md cursor-pointer transition-colors"
                    style={{ color: 'var(--danger)' }}
                  >
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)' }}>
                      <LogOut size={13} />
                    </div>
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
