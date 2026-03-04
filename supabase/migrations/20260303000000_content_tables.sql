-- ── Did You Know facts ───────────────────────────────────────────────────────
CREATE TABLE public.did_you_know (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  fact       text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.did_you_know ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active facts"
  ON public.did_you_know FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage facts"
  ON public.did_you_know FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ── FAQ items ────────────────────────────────────────────────────────────────
CREATE TABLE public.faq_items (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question   text        NOT NULL,
  answer     text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active FAQ items"
  ON public.faq_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage FAQ items"
  ON public.faq_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ── Legal content ────────────────────────────────────────────────────────────
CREATE TABLE public.legal_content (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type       text        NOT NULL UNIQUE CHECK (type IN ('privacy_policy','terms_of_service')),
  content    text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legal_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read legal content"
  ON public.legal_content FOR SELECT USING (true);
CREATE POLICY "Admins manage legal content"
  ON public.legal_content FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed empty rows so the edit screens always have something to load
INSERT INTO public.legal_content (type, content) VALUES
  ('privacy_policy',   'Privacy policy content coming soon.'),
  ('terms_of_service', 'Terms of service content coming soon.')
ON CONFLICT (type) DO NOTHING;
