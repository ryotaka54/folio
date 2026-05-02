-- Offer tracking fields on applications (EN)

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS salary_min     INTEGER,
  ADD COLUMN IF NOT EXISTS salary_max     INTEGER,
  ADD COLUMN IF NOT EXISTS equity_shares  INTEGER,
  ADD COLUMN IF NOT EXISTS equity_cliff   INTEGER,
  ADD COLUMN IF NOT EXISTS signing_bonus  INTEGER,
  ADD COLUMN IF NOT EXISTS bonus_target   INTEGER,
  ADD COLUMN IF NOT EXISTS offer_deadline DATE,
  ADD COLUMN IF NOT EXISTS offer_notes    TEXT DEFAULT '';
