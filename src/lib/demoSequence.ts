import { supabase } from './supabase';
import type { Application, PipelineStage } from './types';

export const DEMO_SPEED = 1; // <1 faster, >1 slower — scales all delays

const DEMO_TAG = '__DEMO__'; // stored in recruiter_email to identify demo apps for cleanup

// ── State & Event Bus ─────────────────────────────────────────────────────────

export interface DemoState {
  active: boolean;
  paused: boolean;
  cursorX: number;
  cursorY: number;
  cursorVisible: boolean;
  showEndSlate: boolean;
}

type StateListener = (s: DemoState) => void;
const listeners = new Set<StateListener>();

const state: DemoState = {
  active: false,
  paused: false,
  cursorX: 0,
  cursorY: 0,
  cursorVisible: false,
  showEndSlate: false,
};

function emit() {
  const snap = { ...state };
  listeners.forEach(fn => fn(snap));
}

export function subscribe(fn: StateListener): () => void {
  listeners.add(fn);
  fn({ ...state }); // deliver current snapshot immediately
  return () => listeners.delete(fn);
}

export function getState(): DemoState {
  return { ...state };
}

// ── Cancel Token ──────────────────────────────────────────────────────────────

interface CancelToken { cancelled: boolean }

// ── Timing ────────────────────────────────────────────────────────────────────

function d(ms: number) { return Math.round(ms * DEMO_SPEED); }

async function psleep(ms: number, token: CancelToken): Promise<void> {
  const end = Date.now() + d(ms);
  while (Date.now() < end) {
    if (token.cancelled) return;
    while (state.paused && !token.cancelled) {
      await new Promise<void>(r => setTimeout(r, 50));
    }
    if (token.cancelled) return;
    const remaining = end - Date.now();
    await new Promise<void>(r => setTimeout(r, Math.min(50, Math.max(0, remaining))));
  }
}

// ── Cursor ────────────────────────────────────────────────────────────────────

async function moveCursorTo(el: Element, token: CancelToken): Promise<void> {
  const rect = el.getBoundingClientRect();
  state.cursorX = rect.left + rect.width / 2;
  state.cursorY = rect.top + rect.height / 2;
  state.cursorVisible = true;
  emit();
  await psleep(550, token); // allow CSS transition to settle
}

// ── Type Utility ──────────────────────────────────────────────────────────────

const nativeSetter =
  typeof window !== 'undefined'
    ? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    : null;

async function typeIntoField(
  el: HTMLInputElement,
  text: string,
  token: CancelToken,
): Promise<void> {
  el.focus();
  for (const char of text) {
    if (token.cancelled) return;
    while (state.paused && !token.cancelled) {
      await new Promise<void>(r => setTimeout(r, 50));
    }
    if (token.cancelled) return;
    if (nativeSetter) {
      nativeSetter.call(el, el.value + char);
    } else {
      el.value = el.value + char;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise<void>(r => setTimeout(r, d(85)));
  }
}

// ── Demo App Data ─────────────────────────────────────────────────────────────

const DEMO_APPS: Array<Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = [
  {
    company: 'Google',
    role: 'SWE Intern',
    location: 'Mountain View, CA',
    category: 'Engineering',
    status: 'Applied' as PipelineStage,
    deadline: '2026-04-15',
    job_link: '',
    notes: '',
    recruiter_name: '',
    recruiter_email: DEMO_TAG,
  },
  {
    company: 'Meta',
    role: 'Software Engineering Intern',
    location: 'Menlo Park, CA',
    category: 'Engineering',
    status: 'OA / Online Assessment' as PipelineStage,
    deadline: '2026-04-10',
    job_link: '',
    notes: '',
    recruiter_name: '',
    recruiter_email: DEMO_TAG,
  },
  {
    company: 'Stripe',
    role: 'Software Engineer Intern',
    location: 'San Francisco, CA',
    category: 'Engineering',
    status: 'Phone / Recruiter Screen' as PipelineStage,
    deadline: '2026-03-30',
    job_link: '',
    notes: '',
    recruiter_name: '',
    recruiter_email: DEMO_TAG,
  },
  {
    company: 'Airbnb',
    role: 'Software Engineer Intern',
    location: 'San Francisco, CA',
    category: 'Engineering',
    status: 'Wishlist' as PipelineStage,
    deadline: null,
    job_link: '',
    notes: '',
    recruiter_name: '',
    recruiter_email: DEMO_TAG,
  },
  {
    company: 'Anthropic',
    role: 'Research Engineer Intern',
    location: 'San Francisco, CA',
    category: 'Engineering',
    status: 'Final Round Interviews' as PipelineStage,
    deadline: '2026-04-01',
    job_link: '',
    notes: '',
    recruiter_name: '',
    recruiter_email: DEMO_TAG,
  },
  {
    company: 'Jane Street',
    role: 'Quantitative Research Analyst',
    location: 'New York, NY',
    category: 'Finance',
    status: 'Offer' as PipelineStage,
    deadline: '2026-03-28',
    job_link: '',
    notes: '',
    recruiter_name: '',
    recruiter_email: DEMO_TAG,
  },
];

// ── Sequence ──────────────────────────────────────────────────────────────────

async function runSequence(token: CancelToken): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || token.cancelled) return;
  const userId = user.id;

  // Centre cursor
  state.cursorX = window.innerWidth / 2;
  state.cursorY = window.innerHeight / 2;
  state.cursorVisible = true;
  state.showEndSlate = false;
  emit();

  // ── Step 1: Clean existing demo apps, seed fresh ones ─────────────────────
  await supabase
    .from('applications')
    .delete()
    .eq('user_id', userId)
    .eq('recruiter_email', DEMO_TAG);

  if (token.cancelled) return;

  const now = new Date().toISOString();
  const insertedIds: string[] = [];

  for (const app of DEMO_APPS) {
    if (token.cancelled) return;
    const { data } = await supabase
      .from('applications')
      .insert({ ...app, user_id: userId, created_at: now, updated_at: now })
      .select('id')
      .single();
    if (data) insertedIds.push((data as { id: string }).id);
    await psleep(600, token);
  }

  if (token.cancelled) return;
  await psleep(1000, token); // let realtime settle

  // ── Step 2: Cursor tour across dashboard elements ──────────────────────────
  const tourIds = ['stats-bar', 'funnel-chart', 'view-toggle', 'search-input'];
  for (const tid of tourIds) {
    if (token.cancelled) return;
    const el = document.querySelector(`[data-tutorial-id="${tid}"]`);
    if (el) {
      await moveCursorTo(el, token);
      await psleep(500, token);
    }
  }

  // ── Step 3: Add application via real modal ─────────────────────────────────
  const addBtn = document.querySelector('[data-tutorial-id="add-button"]');
  if (addBtn) {
    await moveCursorTo(addBtn, token);
    if (token.cancelled) return;
    (addBtn as HTMLElement).click();
    await psleep(700, token); // wait for modal animation
  }

  const companyEl = document.getElementById('modal-company') as HTMLInputElement | null;
  if (companyEl) {
    await moveCursorTo(companyEl, token);
    if (token.cancelled) return;
    await typeIntoField(companyEl, 'Notion', token);
    await psleep(300, token);
  }

  const roleEl = document.getElementById('modal-role') as HTMLInputElement | null;
  if (roleEl) {
    await moveCursorTo(roleEl, token);
    if (token.cancelled) return;
    await typeIntoField(roleEl, 'PM Intern', token);
    await psleep(400, token);
  }

  const saveBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (saveBtn) {
    await moveCursorTo(saveBtn, token);
    if (token.cancelled) return;
    saveBtn.click();
    await psleep(900, token);
  }

  if (token.cancelled) return;

  // ── Step 4: Move Meta from OA → Phone Screen ───────────────────────────────
  const metaId = insertedIds[1]; // Meta is the 2nd inserted app
  if (metaId) {
    await psleep(800, token);
    if (token.cancelled) return;
    await supabase
      .from('applications')
      .update({
        status: 'Phone / Recruiter Screen' as PipelineStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', metaId)
      .eq('user_id', userId);
    await psleep(1000, token);
  }

  if (token.cancelled) return;

  // ── Step 5: End slate ──────────────────────────────────────────────────────
  await psleep(600, token);
  state.cursorVisible = false;
  state.showEndSlate = true;
  emit();

  await psleep(3500, token);

  state.showEndSlate = false;
  emit();
  await psleep(600, token);

  // Sequence complete
  if (!token.cancelled) {
    state.active = false;
    state.cursorVisible = false;
    emit();
    activeToken = null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

let activeToken: CancelToken | null = null;

export function activate(): void {
  if (state.active) {
    deactivate();
    return;
  }
  state.active = true;
  state.paused = false;
  emit();
  const token: CancelToken = { cancelled: false };
  activeToken = token;
  runSequence(token).catch(console.error);
}

export function deactivate(): void {
  if (activeToken) {
    activeToken.cancelled = true;
    activeToken = null;
  }
  state.active = false;
  state.paused = false;
  state.cursorVisible = false;
  state.showEndSlate = false;
  emit();
}

export function togglePause(): void {
  if (!state.active) return;
  state.paused = !state.paused;
  emit();
}

export function restart(): void {
  if (activeToken) {
    activeToken.cancelled = true;
  }
  state.paused = false;
  state.showEndSlate = false;
  state.cursorVisible = false;
  emit();
  const token: CancelToken = { cancelled: false };
  activeToken = token;
  runSequence(token).catch(console.error);
}
