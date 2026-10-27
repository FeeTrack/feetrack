import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser, checkFeatureLimit } from '@/utils/supabase/supabaseQueries';
import { createServerSupabase } from '@/utils/supabase/server';

import UserLayout from '../../UserLayout';
import StudentForm from '../StudentForm';
import { fetchStudentFormOptions } from '../formData';

export const metadata = {
  title: 'Add Student | FeeTrack',
  description: 'Add a new student.'
}

function Notice({ children }) {
  return (
    <div className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {children}
    </div>
  );
}

export default async function AddStudentPage() {
  const profile = await getUser();
  if (!profile) {
    redirect('/login');
  }

  const limitCheck = await checkFeatureLimit(profile.school_id, 'students');
  if (!limitCheck.allowed) {
    return (
      <UserLayout pageName='Add Student'>
        <Notice>Student limit reached. Please upgrade your plan to add more students.</Notice>
      </UserLayout>
    );
  }

  const supabase = await createServerSupabase();
  const [options, { data: school }, { data: lastStudent }] = await Promise.all([
    fetchStudentFormOptions(profile.school_id),
    supabase.from('schools').select('type').eq('id', profile.school_id).single(),
    supabase.from('students').select('adm_no').eq('school_id', profile.school_id).order('adm_no', { ascending: false }).limit(1),
  ]);

  if (options.classes.length === 0) {
    return (
      <UserLayout pageName='Add Student'>
        <Notice>
          Please set up classes first in{' '}
          <Link href='/user/settings/classes-sections' className="font-semibold underline">Settings → Classes &amp; Sections</Link>.
        </Notice>
      </UserLayout>
    );
  }

  const admNo = lastStudent?.length ? lastStudent[0].adm_no + 1 : 1;

  return (
    <UserLayout pageName='Add Student'>
      <StudentForm
        mode='add'
        admNo={admNo}
        schoolType={school?.type}
        {...options}
      />
    </UserLayout>
  );
}
