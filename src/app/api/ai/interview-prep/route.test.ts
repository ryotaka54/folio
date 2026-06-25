import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock } from '@/test-utils/supabase-mock';

const mockGetAuthUser = vi.fn();
vi.mock('@/lib/server-auth', () => ({ getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args) }));

vi.mock('@/lib/anthropic', () => ({
  isProServer: () => false,
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, used: 0, limit: 3 }),
  recordUsage: vi.fn().mockResolvedValue(undefined),
  recordEvent: vi.fn().mockResolvedValue(undefined),
  callClaude: vi.fn().mockResolvedValue(JSON.stringify({
    tldr: 't', company_context: 'c', questions: [], action_items: [], confidence: 'low',
  })),
}));

let supabaseMock: ReturnType<typeof createSupabaseMock>;
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseMock,
}));

describe('POST /api/ai/interview-prep', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetAuthUser.mockReset();
  });

  function makeRequest(body: Record<string, unknown>) {
    return new Request('http://test/api/ai/interview-prep', { method: 'POST', body: JSON.stringify(body) });
  }

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null);
    supabaseMock = createSupabaseMock({});
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ applicationId: 'app-1', company: 'Acme', role: 'SWE', stage: 'Applied' }));
    expect(res.status).toBe(401);
  });

  // Regression test: the applications.update() call that writes ai_interview_prep
  // must be scoped to the requesting user, not just the applicationId. A prior
  // version omitted .eq('user_id', userId), letting any authenticated caller
  // overwrite AI fields on someone else's application by guessing its id.
  it('scopes the applications update to the requesting user', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
    supabaseMock = createSupabaseMock({
      users: { data: { pro: false, pro_expires_at: null, language_preference: 'en' }, error: null },
      applications: { data: null, error: null },
    });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ applicationId: 'app-1', company: 'Acme', role: 'SWE', stage: 'Applied' }));
    expect(res.status).toBe(200);

    const appsChain = supabaseMock.chains['applications'];
    const eqCalls = appsChain.calls.filter(c => c.method === 'eq');
    const userScopeCall = eqCalls.find(c => c.args[0] === 'user_id');
    expect(userScopeCall).toBeDefined();
    expect(userScopeCall?.args).toEqual(['user_id', 'user-1']);
  });
});
