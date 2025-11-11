'use server';
import { createServerSupabase } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/supabaseQueries';
import { redirect } from 'next/navigation';

import UserLayout from '../../UserLayout';
import ClassesClient from './ClassesClient';

export default async function ClassesPage() {
  const supabase = await createServerSupabase();
  const profile = await getUser();
  if (!profile) {
    redirect('/login');
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, sections(id, name)')
    .eq('school_id', profile.school_id)
    .order('name');

  return (
    <UserLayout pageName='Classes & Sections'>
      <ClassesClient classes={classes ?? []} />;
    </UserLayout>
  );
}
