INSERT INTO app_config (key, value) VALUES
  ('did_you_know_link_url', 'https://www.amazon.co.uk/Normans-Conquest-invasion-Englands-traditional/dp/B0G6VF3NRL'),
  ('did_you_know_link_text', 'Learn more from'),
  ('did_you_know_link_bold', 'Norman''s Conquest')
ON CONFLICT (key) DO NOTHING;
