import { notFound, redirect } from 'next/navigation';
import { getUser, checkFeatureAccess } from '@/utils/supabase/supabaseQueries';
import { createServerSupabase } from '@/utils/supabase/server';
import { getSignedPhotoUrl } from '@/utils/photos';

import UserLayout from '../../../UserLayout';
import StaffForm from '../../StaffForm';

export const metadata = {
  title: 'Edit Staff | FeeTrack',
  description: 'Edit staff details.'
}

export default async function EditStaffPage({ params }) {
  const { id } = await params;

  const profile = await getUser();
  if (!profile) {
    redirect('/login');
  }

  const accessCheck = await checkFeatureAccess(profile.school_id, 'staffModule');
  if (!accessCheck.allowed) {
    redirect('/user/staff');
  }

  const supabase = await createServerSupabase();
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .eq('school_id', profile.school_id)
    .maybeSingle();

  if (!staff) {
    notFound();
  }

  const photoUrl = await getSignedPhotoUrl(staff.photo_path);

  return (
    <UserLayout pageName='Edit Staff'>
      <StaffForm mode='edit' staff={staff} photoUrl={photoUrl} />
    </UserLayout>
  );
}
