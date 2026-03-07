-- Allow admins to delete feedback items
CREATE POLICY "admins_can_delete_feedback" ON public.feedback
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
