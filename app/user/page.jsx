// app/dashboard/page.jsx
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/supabaseQueries';

export default async function DashboardPage() {
  const profile = await getUser();
  if (!profile) {
      redirect('/login');
  } else {
    redirect('/user/dashboard');
  }
}
