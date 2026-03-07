-- Allow group admins to delete messages (bulk chat clear).
create policy "Group admins can delete messages"
  on public.group_messages for delete to authenticated
  using (is_group_admin(group_id));
