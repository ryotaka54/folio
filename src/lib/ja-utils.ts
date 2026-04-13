'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Date formatting ──────────────────────────────────────────────────────────

/**
 * Format a date string as 2026年4月13日
 */
export function formatDateJa(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * Format a date string as 4月13日 (short form, no year)
 */
export function formatDateShortJa(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

/**
 * Returns あとN日 / 今日締め切り / 期限切れ for a deadline string
 */
export function formatDeadlineJa(deadlineStr: string | null | undefined): {
  label: string;
  urgency: 'none' | 'info' | 'warning' | 'danger';
} {
  if (!deadlineStr) return { label: '', urgency: 'none' };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadlineStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { label: '期限切れ', urgency: 'danger' };
  if (diff === 0) return { label: '今日締め切り', urgency: 'danger' };
  if (diff <= 3) return { label: `あと${diff}日`, urgency: 'danger' };
  if (diff <= 7) return { label: `あと${diff}日`, urgency: 'warning' };
  if (diff <= 14) return { label: `あと${diff}日`, urgency: 'info' };
  return { label: `あと${diff}日`, urgency: 'none' };
}

// ── Currency formatting ──────────────────────────────────────────────────────

/**
 * Format a number as ¥1,000
 */
export function formatCurrencyJa(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

// ── Character count hook ─────────────────────────────────────────────────────

export interface CharacterCountResult {
  count: number;
  max: number;
  percentage: number;
  isOverLimit: boolean;
  isNearLimit: boolean; // within 20 chars of limit
}

export function useCharacterCount(value: string, max: number): CharacterCountResult {
  const count = value.length;
  const percentage = max > 0 ? (count / max) * 100 : 0;
  return {
    count,
    max,
    percentage,
    isOverLimit: count > max,
    isNearLimit: count >= max - 20 && count <= max,
  };
}

// ── Autosave hook ────────────────────────────────────────────────────────────

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave<T>(
  value: T,
  saveFn: (v: T) => Promise<void>,
  delay = 500,
): SaveState {
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const save = useCallback(
    async (v: T) => {
      setSaveState('saving');
      try {
        await saveFn(v);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    },
    [saveFn],
  );

  useEffect(() => {
    if (saveState === 'saving') return;
    const t = setTimeout(() => save(value), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return saveState;
}

// ── Greeting by time ─────────────────────────────────────────────────────────

export function getGreetingJa(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'おはようございます';
  if (hour < 17) return 'こんにちは';
  return 'こんばんは';
}

// ── Naitei countdown ─────────────────────────────────────────────────────────

export function getNaiteiCountdown(deadlineStr: string | null | undefined): {
  days: number;
  urgency: 'safe' | 'warning' | 'danger';
} | null {
  if (!deadlineStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadlineStr);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { days, urgency: 'danger' };
  if (days < 7) return { days, urgency: 'danger' };
  if (days < 14) return { days, urgency: 'warning' };
  return { days, urgency: 'safe' };
}
