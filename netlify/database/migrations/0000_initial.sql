-- Navi Hampton Roads — Initial Schema
-- Netlify Database automatically applies this migration on deploy.

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  preferences TEXT[] DEFAULT '{}',
  credibility_score INTEGER DEFAULT 100,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('suggested','accepted','checked_in','skipped','declined')),
  liked BOOLEAN,
  disliked BOOLEAN,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_place_id ON visits(place_id);

CREATE TABLE IF NOT EXISTS place_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON place_feedback(user_id);
