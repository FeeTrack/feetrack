// app/(auth)/logout/actions.js
'use server';
import { createServerSupabase } from '@/utils/supabase/server';
import { clearSelectedSession } from '@/utils/session/currentSession';

export async function logoutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  await clearSelectedSession();
  // Return a simple result instead of redirecting — the client will handle navigation.
  return { success: true };
}
