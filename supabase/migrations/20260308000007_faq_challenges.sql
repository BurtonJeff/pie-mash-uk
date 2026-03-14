INSERT INTO faq_items (question, answer, is_active, sort_order) VALUES (
  'What is the difference between Global Challenges and Group Challenges?',
  'Global Challenges are created by the Pie & Mash team and are available to all users. Completing a global challenge earns you a badge and is a great way to discover more shops. Group Challenges are created by group admins and are only visible to members of that group — perfect for a bit of friendly competition within your pie-loving circle!',
  true,
  100
) ON CONFLICT DO NOTHING;
