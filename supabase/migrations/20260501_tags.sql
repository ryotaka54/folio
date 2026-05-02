-- Custom tags for applications

CREATE TABLE public.tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_own" ON public.tags
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.application_tags (
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  tag_id         UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, tag_id)
);
ALTER TABLE public.application_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "application_tags_own" ON public.application_tags
  USING (EXISTS (
    SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid()
  ));
