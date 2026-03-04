-- Allow users to update their own check-ins (photo and notes only)
CREATE POLICY "Users can update own checkins"
  ON public.checkins FOR UPDATE
  USING (user_id = auth.uid());
