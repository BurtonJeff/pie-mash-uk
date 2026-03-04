import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  setSession: (session) => set({ session, user: session?.user ?? null, initialized: true }),
}));

// Call once at app startup — keeps the store in sync with Supabase auth state.
export function initAuthListener() {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session);
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    useAuthStore.getState().setSession(session);

    // Supabase rotates refresh tokens on every refresh. Keep the stored
    // biometric token in sync so biometric sign-in doesn't fail with a
    // stale token.
    if (event === 'TOKEN_REFRESHED' && session?.refresh_token) {
      const { isBiometricsEnabled, enableBiometrics } = await import('../lib/biometrics');
      if (await isBiometricsEnabled()) {
        await enableBiometrics(session.refresh_token);
      }
    }
  });
}
