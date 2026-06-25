import '@testing-library/jest-dom/vitest';

// Modules like supabase.ts throw at import time if these are unset.
// Tests never hit the network, so dummy values are sufficient.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';
process.env.ANTHROPIC_API_KEY ??= 'test-anthropic-key';

