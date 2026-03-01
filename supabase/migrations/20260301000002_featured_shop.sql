-- Add is_featured flag to shops so admins can highlight a "Shop of the Week"
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
