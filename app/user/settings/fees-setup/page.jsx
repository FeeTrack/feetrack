// app/dashboard/fee_heads/page.jsx
import { fetchFeeHeadsAndClasses } from '@/utils/supabase/supabaseQueries';
import { redirect } from 'next/navigation';

import UserLayout from '../../UserLayout';
import FeesSetupClient from './FeesSetupClient';

export default async function FeesSetupPage() {  
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