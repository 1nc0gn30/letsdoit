-- Align existing Netlify Database tables with the function contract.

ALTER TABLE profiles
  ALTER COLUMN preferences SET DEFAULT ARRAY[]::text[];

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
