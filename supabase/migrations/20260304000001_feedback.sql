-- Feedback submissions table
CREATE TABLE public.feedback (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  message       text        NOT NULL CHECK (char_length(trim(message)) > 0),
  submitted_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit feedback
CREATE POLICY "users_can_insert_feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all feedback
CREATE POLICY "admins_can_read_feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function that returns admin email addresses (reads auth.users via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_admin_emails()
RETURNS TABLE(email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT au.email::text
    FROM auth.users au
    INNER JOIN public.profiles p ON p.id = au.id
    WHERE p.is_admin = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_emails() TO service_role;
