CREATE TABLE IF NOT EXISTS shop_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  previous_data jsonb NOT NULL,
  new_data jsonb NOT NULL
);
ALTER TABLE shop_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit log" ON shop_audit_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE OR REPLACE FUNCTION log_shop_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO shop_audit_log (shop_id, changed_by, previous_data, new_data)
  VALUES (NEW.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

CREATE TRIGGER shop_changes_audit
AFTER UPDATE ON shops
FOR EACH ROW EXECUTE FUNCTION log_shop_changes();
