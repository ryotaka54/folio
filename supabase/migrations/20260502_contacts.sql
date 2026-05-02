-- Contacts CRM

CREATE TABLE public.contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  company           TEXT NOT NULL DEFAULT '',
  role              TEXT NOT NULL DEFAULT '',
  linkedin_url      TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  phone             TEXT NOT NULL DEFAULT '',
  relationship_type TEXT NOT NULL DEFAULT 'recruiter'
    CHECK (relationship_type IN ('recruiter','referral','employee','alumni','other')),
  notes             TEXT NOT NULL DEFAULT '',
  last_contact_date DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_own" ON public.contacts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.contact_applications (
  contact_id     UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, application_id)
);
ALTER TABLE public.contact_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_own" ON public.contact_applications
  USING (EXISTS (
    SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()
  ));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_contacts_updated_at();
