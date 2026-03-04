-- Add criteria_shops column to badges for the 'shop_tour' criteria type.
-- Stores an array of shop UUIDs the user must visit to earn the badge.
ALTER TABLE public.badges ADD COLUMN criteria_shops uuid[] DEFAULT NULL;
