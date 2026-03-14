ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS deliveroo_url text,
  ADD COLUMN IF NOT EXISTS uber_eats_url text,
  ADD COLUMN IF NOT EXISTS mail_order_url text;
