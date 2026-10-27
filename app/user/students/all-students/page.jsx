import { getUser } from '@/utils/supabase/supabaseQueries';
import { createServerSupabase } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/utils/session/currentSession';

import UserLayout from '../../UserLayout';
import StudentsClient from './StudentsClient';

export const metadata = {
    title: 'Students | FeeTrack',
    description: 'Lists and allows to manage students.'
}

export default async function StudentsPage() {
    const supabase = await createServerSupabase();

    const profile = await getUser();
    if (!profile) {
      redirect('/login');
    }

    const { data: schType } = await supabase
        .from('schools')
        .select('type')
        .eq('id', profile.school_id)
        .single();
    const schoolType = schType.type;

    const currentSession = await getCurrentSession();
    
    const { data: recentAdmissions } = await supabase
      .from('students')
      .select('id, name, adm_no, roll_no, classes(name), sections(name), father_name, mother_name, parent_mobile, class_id, section_id, adm_date, type, status, month_fee_from, route_id, photo_path')
      .eq('school_id', profile.school_id)
      .eq('session_id', currentSession?.id)
      .order("created_at", { ascending: false })
      .order('adm_no', { ascending: false })
      .limit(10);
  
  return (
    <UserLayout pageName='Students'>
        <StudentsClient profile={profile} schoolType={schoolType} recentAdmissions={recentAdmissions} />
    </UserLayout>
  );
}
