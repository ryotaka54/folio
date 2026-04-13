-- ── Community ideas seed ─────────────────────────────────────────────────────
-- Run this in your Supabase SQL Editor to pre-populate the voting board.
-- These are realistic, high-quality ideas that will resonate with students.
-- Run ONCE — re-running will insert duplicates.

INSERT INTO community_ideas (idea_text, tiktok_username, vote_count, date_submitted, status, day_number, feature_name, feature_description, built_date, screenshot_url)
VALUES
  (
    'Show me which companies have the fastest response times so I know who actually gets back to applicants',
    NULL,
    47,
    NOW() - INTERVAL '2 days',
    'pending', NULL, NULL, NULL, NULL, NULL
  ),
  (
    'Auto-detect when a job posting gets taken down and alert me so I know the role is probably filled',
    NULL,
    39,
    NOW() - INTERVAL '2 days',
    'pending', NULL, NULL, NULL, NULL, NULL
  ),
  (
    'Let me set a daily application goal and get a push notification if I haven''t logged anything by 8pm',
    NULL,
    34,
    NOW() - INTERVAL '1 day',
    'pending', NULL, NULL, NULL, NULL, NULL
  ),
  (
    'Add a salary range field so I can compare offers and see what different companies pay for the same role',
    NULL,
    28,
    NOW() - INTERVAL '1 day',
    'pending', NULL, NULL, NULL, NULL, NULL
  ),
  (
    'Show me a heatmap of what days/times I apply most and whether that correlates with getting responses',
    NULL,
    22,
    NOW() - INTERVAL '3 hours',
    'pending', NULL, NULL, NULL, NULL, NULL
  ),
  (
    'Let me tag applications with custom labels like "dream job", "safety net", "reach" so I can filter by priority',
    NULL,
    19,
    NOW() - INTERVAL '5 hours',
    'pending', NULL, NULL, NULL, NULL, NULL
  ),
  (
    'AI that reads my resume and tells me which of my tracked applications I''m most likely to get an interview at',
    NULL,
    15,
    NOW() - INTERVAL '6 hours',
    'pending', NULL, NULL, NULL, NULL, NULL
  ),
  (
    'Chrome extension that auto-fills Applyd when I hit "Apply" on Handshake, LinkedIn, or Indeed',
    NULL,
    11,
    NOW() - INTERVAL '8 hours',
    'pending', NULL, NULL, NULL, NULL, NULL
  );
