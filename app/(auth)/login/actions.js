// app/(auth)/login/actions.js
'use server';
import { createServerSupabase } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(prevState , formData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const supabase = await createServerSupabase();

  // sign in with email + password, supabase will set secure cookies via the server client
  const { data: userData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Throwing sends error back to the form submit (you can wrap and display in UI)
    console.error('Login error:', error);
    return { error: 'Invalid email or password. Please try again.'};
  }

  const { data: planData, error: planError }  = await supabase
    .from('schools')
    .select('plan, valid_till')
    .eq('created_by', userData.user?.id)
    .single();
  if (planError || !planData) {
    console.error('Error fetching plan data: ' + planError.message)
    return { error: 'Failed to retrieve plan data.'}
  }

  const validTill = new Date(planData.valid_till);
  validTill.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0,0,0,0);

  if (validTill < today) {
    await supabase.auth.signOut();
    return { error: {code: 'PLAN_EXPIRED'}};
  }

  // on success, redirect to dashboard (session cookies are set by the server client)
  redirect('/user/dashboard');
}
