import { redirect } from 'next/navigation';
import { getUser, checkFeatureAccess, checkFeatureLimit } from '@/utils/supabase/supabaseQueries';

import UserLayout from '../../UserLayout';
import StaffForm from '../StaffForm';

export const metadata = {
  title: 'Add Staff | FeeTrack',
  description: 'Add a new staff member.'
}

function Notice({ children }) {
  return (
    <div className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {children}
    </div>
  );
}

export default async function AddStaffPage() {
  const profile = await getUser();
  if (!profile) {
    redirect('/login');
  }

  const [accessCheck, limitCheck] = await Promise.all([
    checkFeatureAccess(profile.school_id, 'staffModule'),
    checkFeatureLimit(profile.school_id, 'staff'),
  ]);

  if (!accessCheck.allowed || !limitCheck.allowed) {
    return (
      <UserLayout pageName='Add Staff'>
        <Notice>
          {!accessCheck.allowed
            ? 'This feature is not available in your current plan. Kindly upgrade to access this feature.'
            : 'Staff limit reached. Please upgrade your plan to add more staff.'}
        </Notice>
      </UserLayout>
    );
  }

  return (
    <UserLayout pageName='Add Staff'>
      <StaffForm mode='add' />
    </UserLayout>
  );
}
