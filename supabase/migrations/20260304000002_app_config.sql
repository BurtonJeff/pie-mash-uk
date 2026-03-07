-- Generic key/value store for app-wide configuration
CREATE TABLE public.app_config (
  key        text        PRIMARY KEY,
  value      text        NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config values
CREATE POLICY "public_read_app_config" ON public.app_config
  FOR SELECT USING (true);

-- Only admins can write
CREATE POLICY "admins_write_app_config" ON public.app_config
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Seed defaults
INSERT INTO public.app_config (key, value) VALUES
  ('home_subtitle', 'Preserving a Great British Tradition, One Visit at a Time');
