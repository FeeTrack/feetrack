import { fetchFeeHeadsAndClasses } from '@/utils/supabase/supabaseQueries';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/supabaseQueries';

import UserLayout from '../../UserLayout';
import FeesSetupClient from './FeesSetupClient';

export const metadata = {
    title: 'Fees Setup | FeeTrack',
    description: 'The page for setting up classwise fee.'
}

export default async function FeesSetupPage() {  
  const profile = await getUser();
  if (!profile) {
    redirect('/login')
  }
  if (profile.role !== 'admin') {
    return (
      <UserLayout pageName='Staff'>
        <div className="w-full h-full flex justify-center items-center">
          <h1>Unauthorized Access.</h1>
        </div>
      </UserLayout>
    )
  }

  const { feeHeads, classes, error } = await fetchFeeHeadsAndClasses();
  if (error?.code === 'NO_PROFILE') {
    redirect('/login');
  }

  return (
    <UserLayout pageName='Fees Setup'>
      {classes?.length === 0 ? (
        <div className="w-full text-center">
          No classes found. Please set up classes first in the <span className="text-primary">settings</span>.
        </div>
      ) : (
        <FeesSetupClient feeHeads={feeHeads ?? []} classes={classes ?? []} />        
      )}
    </UserLayout>
  );
}