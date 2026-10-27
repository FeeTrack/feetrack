import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/supabaseQueries';
import { createServerSupabase } from '@/utils/supabase/server';

import UserLayout from '../../../UserLayout';
import StudentForm from '../../StudentForm';
import { fetchStudentFormOptions, getStudentPhotoUrl } from '../../formData';

export const metadata = {
  title: 'Edit Student | FeeTrack',
  description: 'Edit student details.'
}

export default async function EditStudentPage({ params }) {
  const { id } = await params;

  const profile = await getUser();
  if (!profile) {
    redirect('/login');
  }

  const supabase = await createServerSupabase();
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .eq('school_id', profile.school_id)
    .maybeSingle();

  if (!student) {
    notFound();
  }

  const [options, photoUrl] = await Promise.all([
    fetchStudentFormOptions(profile.school_id),
    getStudentPhotoUrl(student.photo_path),
  ]);

  return (
    <UserLayout pageName='Edit Student'>
      <StudentForm mode='edit' student={student} photoUrl={photoUrl} {...options} />
    </UserLayout>
  );
}
