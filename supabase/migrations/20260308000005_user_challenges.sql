CREATE TABLE IF NOT EXISTS user_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own completions" ON user_challenges
  FOR SELECT USING (user_id = auth.uid());

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS badge_id uuid REFERENCES badges(id);
