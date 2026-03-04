import { supabase } from './supabase';

export async function submitFeedback(userId: string, message: string): Promise<void> {
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, message });
  if (error) throw error;
}
