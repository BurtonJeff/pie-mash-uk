-- Store Expo push token on the user's profile so edge functions can send notifications.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
