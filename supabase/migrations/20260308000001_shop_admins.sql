CREATE TABLE IF NOT EXISTS shop_admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (user_id, shop_id)
);
ALTER TABLE shop_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage shop_admins" ON shop_admins
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Shop admins read own rows" ON shop_admins
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Shop admins update own shops" ON shops
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM shop_admins WHERE user_id = auth.uid() AND shop_id = shops.id)
  );
