import { describe, it, expect } from 'vitest';
import { isPro } from './pro';

describe('isPro', () => {
  it('returns false for null user', () => {
    expect(isPro(null)).toBe(false);
  });

  it('returns false when pro flag is not set', () => {
    expect(isPro({ pro: false })).toBe(false);
    expect(isPro({})).toBe(false);
  });

  it('returns true when pro is true with no expiry', () => {
    expect(isPro({ pro: true, pro_expires_at: null })).toBe(true);
  });

  it('returns true when pro is true and expiry is in the future', () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    expect(isPro({ pro: true, pro_expires_at: future })).toBe(true);
  });

  it('returns false when pro is true but expiry has passed', () => {
    const past = new Date(Date.now() - 86400_000).toISOString();
    expect(isPro({ pro: true, pro_expires_at: past })).toBe(false);
  });

  it('treats expiry exactly now as expired', () => {
    const now = new Date(Date.now() - 1).toISOString();
    expect(isPro({ pro: true, pro_expires_at: now })).toBe(false);
  });
});
