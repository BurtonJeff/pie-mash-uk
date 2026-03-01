-- =============================================================
-- Seed data: 10 shops + 9 badges
-- Safe to re-run: ON CONFLICT (slug) DO NOTHING
-- Challenges are excluded — they require a created_by profile FK;
-- create them through the app's Admin Panel after signing up.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- SHOPS
-- ─────────────────────────────────────────────────────────────

-- Helper JSONB values used repeatedly
-- Standard weekday hours (11:00–14:30), closed Sunday
-- Inserted inline per shop so each can differ where needed

INSERT INTO shops (slug, name, description, address_line1, address_line2, city, postcode,
  latitude, longitude, phone, website, founded_year,
  price_range, is_active, is_featured, features, opening_hours)
VALUES

-- 1. M. Manze — Bermondsey (featured on home tab)
(
  'm-manze-tower-bridge',
  'M. Manze',
  'One of London''s oldest surviving pie & mash shops, opened 1902. Grade II listed Victorian interior — original marble tops, tiled walls, and wooden benches unchanged for over 120 years.',
  '87 Tower Bridge Road', NULL, 'London', 'SE1 4TW',
  51.4993, -0.0818,
  '020 7407 2985', 'http://www.manze.co.uk', 1902,
  1, true, true,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"11:00","close":"14:00","closed":false},"tuesday":{"open":"11:00","close":"14:00","closed":false},"wednesday":{"open":"11:00","close":"14:00","closed":false},"thursday":{"open":"11:00","close":"14:00","closed":false},"friday":{"open":"11:00","close":"14:30","closed":false},"saturday":{"open":"10:00","close":"14:30","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 2. L. Manze — Deptford
(
  'l-manze-deptford',
  'L. Manze',
  'Run by descendants of the same Manze family since 1892, making it one of the oldest pie & mash businesses in London. Classic Victorian shopfront on Deptford High Street.',
  '76 Deptford High Street', NULL, 'London', 'SE8 4RT',
  51.4777, -0.0231,
  '020 8692 2375', NULL, 1892,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"11:00","close":"14:00","closed":false},"tuesday":{"open":"11:00","close":"14:00","closed":false},"wednesday":{"open":"11:00","close":"14:00","closed":false},"thursday":{"open":"11:00","close":"14:00","closed":false},"friday":{"open":"11:00","close":"14:30","closed":false},"saturday":{"open":"10:00","close":"14:30","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 3. Cooke's — Broadway Market
(
  'cookes-broadway-market',
  'Cooke''s',
  'A well-loved Hackney institution on the fashionable Broadway Market. Traditional pie, mash, and liquor alongside jellied and stewed eels, served with a friendly nod to the past.',
  '9 Broadway Market', NULL, 'London', 'E8 4PH',
  51.5356, -0.0657,
  '020 7254 6458', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"00:00","close":"00:00","closed":true},"tuesday":{"open":"10:00","close":"15:00","closed":false},"wednesday":{"open":"10:00","close":"15:00","closed":false},"thursday":{"open":"10:00","close":"15:00","closed":false},"friday":{"open":"10:00","close":"15:00","closed":false},"saturday":{"open":"09:00","close":"15:00","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 4. G. Kelly — Bethnal Green
(
  'g-kelly-bethnal-green',
  'G. Kelly',
  'A Roman Road and Bethnal Green favourite for generations. G. Kelly keeps it traditional: minced beef pie, fluffy mash, and lashings of green liquor at prices that haven''t caught up with the 21st century.',
  '414 Bethnal Green Road', NULL, 'London', 'E2 0DJ',
  51.5257, -0.0615,
  '020 7739 5388', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"10:00","close":"15:00","closed":false},"tuesday":{"open":"10:00","close":"15:00","closed":false},"wednesday":{"open":"10:00","close":"15:00","closed":false},"thursday":{"open":"10:00","close":"15:00","closed":false},"friday":{"open":"10:00","close":"15:00","closed":false},"saturday":{"open":"09:30","close":"15:00","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 5. Harrington's — Tooting
(
  'harringtons-tooting',
  'Harrington''s',
  'South London''s pride. Harrington''s in Tooting serves up generous portions of pie and mash to a devoted local following, with stewed and jellied eels also on the menu.',
  '3 Selkirk Road', NULL, 'London', 'SW17 0ES',
  51.4268, -0.1659,
  '020 8672 1881', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"11:00","close":"14:30","closed":false},"tuesday":{"open":"11:00","close":"14:30","closed":false},"wednesday":{"open":"11:00","close":"14:30","closed":false},"thursday":{"open":"11:00","close":"14:30","closed":false},"friday":{"open":"11:00","close":"14:30","closed":false},"saturday":{"open":"10:00","close":"14:30","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 6. Castle's — Camden
(
  'castles-camden',
  'Castle''s',
  'A proper working-class caff tucked away in Camden, Castle''s is the real deal. No tourists, no nonsense — just excellent pie, creamy mash, and the best liquor north of the river.',
  '229 Royal College Street', NULL, 'London', 'NW1 9LT',
  51.5396, -0.1427,
  '020 7485 2196', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"11:00","close":"14:30","closed":false},"tuesday":{"open":"11:00","close":"14:30","closed":false},"wednesday":{"open":"11:00","close":"14:30","closed":false},"thursday":{"open":"11:00","close":"14:30","closed":false},"friday":{"open":"11:00","close":"14:30","closed":false},"saturday":{"open":"10:00","close":"14:30","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 7. Goddard's — Greenwich
(
  'goddards-greenwich',
  'Goddard''s',
  'Steps from the Cutty Sark in the heart of Greenwich, Goddard''s has been feeding pie enthusiasts and tourists alike for decades. A welcoming spot with generous portions.',
  '22 King William Walk', NULL, 'London', 'SE10 9HU',
  51.4829, -0.0096,
  '020 8305 9612', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"10:00","close":"18:00","closed":false},"tuesday":{"open":"10:00","close":"18:00","closed":false},"wednesday":{"open":"10:00","close":"18:00","closed":false},"thursday":{"open":"10:00","close":"18:00","closed":false},"friday":{"open":"10:00","close":"18:00","closed":false},"saturday":{"open":"09:30","close":"18:00","closed":false},"sunday":{"open":"10:00","close":"17:00","closed":false}}'::jsonb
),

-- 8. Arments — Walworth
(
  'arments-walworth',
  'Arments',
  'A Walworth Road stalwart with a loyal local following. Arments does things the old-fashioned way: hand-raised pies, fresh mash, and liquor made to a decades-old recipe.',
  '7-9 Westmoreland Road', NULL, 'London', 'SE17 2AX',
  51.4862, -0.0950,
  '020 7703 4974', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"10:30","close":"15:00","closed":false},"tuesday":{"open":"10:30","close":"15:00","closed":false},"wednesday":{"open":"10:30","close":"15:00","closed":false},"thursday":{"open":"10:30","close":"15:00","closed":false},"friday":{"open":"10:30","close":"15:00","closed":false},"saturday":{"open":"10:00","close":"15:00","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 9. Clark's — Exmouth Market
(
  'clarks-exmouth-market',
  'Clark''s',
  'Perched on Exmouth Market in Clerkenwell, Clark''s brings traditional pie and mash to EC1. A welcoming destination for city workers and locals looking for a proper, affordable hot lunch.',
  '46 Exmouth Market', NULL, 'London', 'EC1R 4QE',
  51.5243, -0.1087,
  '020 7837 1974', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"11:00","close":"15:00","closed":false},"tuesday":{"open":"11:00","close":"15:00","closed":false},"wednesday":{"open":"11:00","close":"15:00","closed":false},"thursday":{"open":"11:00","close":"15:00","closed":false},"friday":{"open":"11:00","close":"15:00","closed":false},"saturday":{"open":"00:00","close":"00:00","closed":true},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
),

-- 10. S&R Kelly — Bethnal Green Road
(
  'sr-kelly-bethnal-green',
  'S&R Kelly',
  'Another respected name on Bethnal Green Road, S&R Kelly has served the East End community for generations. Known for excellent stewed eels alongside the classic pie, mash, and liquor.',
  '284 Bethnal Green Road', NULL, 'London', 'E2 0AG',
  51.5249, -0.0638,
  '020 7739 6851', NULL, NULL,
  1, true, false,
  '{"is_takeaway": true, "has_seating": true, "has_parking": false}'::jsonb,
  '{"monday":{"open":"10:00","close":"15:00","closed":false},"tuesday":{"open":"10:00","close":"15:00","closed":false},"wednesday":{"open":"10:00","close":"15:00","closed":false},"thursday":{"open":"10:00","close":"15:00","closed":false},"friday":{"open":"10:00","close":"15:00","closed":false},"saturday":{"open":"09:30","close":"15:00","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb
)

ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- BADGES
-- ─────────────────────────────────────────────────────────────

INSERT INTO badges (slug, name, description, icon_url, category, criteria_type, criteria_value, is_active)
VALUES

-- Milestone — check-in count
('first-bite',      'First Bite',     'Checked in at your very first pie & mash shop. Welcome to the family!',                          '🥧', 'milestone', 'total_checkins',  1,  true),
('regular-punter',  'Regular Punter', 'Five check-ins and counting. You clearly know a good thing when you see it.',                    '🍽️', 'milestone', 'total_checkins',  5,  true),
('pie-devotee',     'Pie Devotee',    'Ten check-ins. The liquor flows freely for those who are truly devoted.',                        '⭐', 'milestone', 'total_checkins',  10, true),
('pie-fanatic',     'Pie Fanatic',    'Twenty-five check-ins. You''re not just a fan, you''re an ambassador.',                         '🏆', 'milestone', 'total_checkins',  25, true),
('pie-legend',      'Pie Legend',     'Fifty check-ins. Songs will be sung about your dedication to the humble pie.',                   '👑', 'milestone', 'total_checkins',  50, true),

-- Explorer — unique shops visited
('shop-hopper',     'Shop Hopper',    'Visited 3 different shops. Your palate is broadening — can you taste the difference?',           '🗺️', 'explorer',  'unique_shops',    3,  true),
('pie-adventurer',  'Pie Adventurer', 'Five unique shops visited. A true explorer of London''s pie & mash scene.',                     '🧭', 'explorer',  'unique_shops',    5,  true),
('pie-nomad',       'Pie Nomad',      'Ten shops visited. You''ve criss-crossed the city in pursuit of the perfect plate.',             '✈️', 'explorer',  'unique_shops',    10, true),
('master-taster',   'Master Taster',  'Twenty-five unique shops. At this point, you should probably write a book.',                    '🎓', 'explorer',  'unique_shops',    25, true)

ON CONFLICT (slug) DO NOTHING;
