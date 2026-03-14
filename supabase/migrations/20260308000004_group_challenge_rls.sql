CREATE POLICY "Group admins create group challenges" ON challenges
  FOR INSERT WITH CHECK (
    scope = 'group'
    AND group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = challenges.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
  );
