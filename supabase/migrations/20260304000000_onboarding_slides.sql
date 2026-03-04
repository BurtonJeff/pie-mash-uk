-- Onboarding slides table
CREATE TABLE public.onboarding_slides (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  subtitle    text        NOT NULL,
  emoji       text,
  image_url   text,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_slides ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active slides
CREATE POLICY "Public can read onboarding slides"
  ON public.onboarding_slides FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admins manage onboarding slides"
  ON public.onboarding_slides FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Storage bucket for onboarding images
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-images', 'onboarding-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view onboarding images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'onboarding-images');

CREATE POLICY "Admins can upload onboarding images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'onboarding-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete onboarding images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'onboarding-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Seed with the current hardcoded slides
INSERT INTO public.onboarding_slides (title, subtitle, emoji, sort_order) VALUES
  (E'Welcome to\nPie & Mash',    E'Your definitive guide to Britain''s finest traditional pie & mash shops.',         '🥧', 0),
  (E'Check In\n& Earn Points',   'Visit a shop, snap a photo, and check in. Every visit earns you points and badges.', '📍', 1),
  (E'Compete\n& Connect',        'Climb the leaderboard, collect badges, and challenge your mates in groups.',         '🏆', 2);
