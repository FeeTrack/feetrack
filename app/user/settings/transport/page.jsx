import { createServerSupabase } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/supabaseQueries';
import { redirect } from 'next/navigation';

import UserLayout from '../../UserLayout';
import TransportClient from './TransportClient';

export const metadata = {
    title: 'Transport | FeeTrack',
    description: 'The page for setting up transport routes and fee.'
}

export default async function TransportSetupPage() {  
  const profile = await getUser();
  if (!profile) {
    redirect('/login')
  }

  const supabase = await createServerSupabase();

  const { data: transport_routes } = await supabase
    .from('transport_routes')
    .select('id, name, monthly_fee, vehicle_no')
    .eq('school_id', profile.school_id);

  return (
    <UserLayout pageName='Transport'>
        <TransportClient profile={profile} transportRoutes={transport_routes} />
    </UserLayout>
  );
}