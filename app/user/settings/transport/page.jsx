import { createServerSupabase } from '@/utils/supabase/server';
import { getUser, checkFeatureAccess } from '@/utils/supabase/supabaseQueries';
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

  const accessCheck = await checkFeatureAccess(profile.school_id, 'transportModule')
  if (!accessCheck.allowed) {
      return (
          <UserLayout pageName='Transport'>
          <div className="w-full h-full flex justify-center items-center">
              <h1>This feature is not available in your current plan. Kindly upgrade to access this feature.</h1>
          </div>
          </UserLayout>
      )
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