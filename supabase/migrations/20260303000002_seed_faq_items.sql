-- Seed faq_items with the existing hardcoded FAQ content from FAQScreen.tsx

INSERT INTO public.faq_items (question, answer, sort_order) VALUES
  ('How does checking in work?', 'You need to be within 200 metres of a shop to check in. The app uses your GPS location to verify this. You can only check in to the same shop once per day.', 1),
  ('How are points calculated?', 'Your first ever visit to a shop earns 35 points — a 10-point base plus a 25-point first-visit bonus. Every return visit to that same shop on a different day earns 10 points.', 2),
  ('What are badges?', 'Badges are awarded automatically when you reach certain milestones, such as visiting your first shop, checking in at 5 different shops, or logging 10 total visits.', 3),
  ('What is Shop of the Week?', 'Each week the Pie & Mash UK team highlights a featured shop on the home screen — a great way to discover somewhere new.', 4),
  ('Can I check in to the same shop more than once?', 'Yes, but only once per day. You can visit as many different shops as you like on the same day and check in to each one.', 5),
  ('What are groups?', 'Groups let you connect with friends and fellow pie & mash fans. Create a group, share your invite code, and chat with members in the Community tab.', 6),
  ('How do I join a group?', 'Open the Community tab and tap "Join Group". Enter the invite code shared by your group admin.', 7),
  ('What is the leaderboard?', 'The Community tab shows an all-time leaderboard and a weekly leaderboard ranked by points. Keep visiting shops to climb the ranks!', 8),
  ('How do I get in touch?', 'You can reach us at hello@piemashanduk.com', 9);
