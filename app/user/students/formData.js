import { createServerSupabase } from '@/utils/supabase/server';

// Classes, sections and transport routes for the add / edit student forms
export async function fetchStudentFormOptions(schoolId) {
  const supabase = await createServerSupabase();

  const [{ data: classes }, { data: sections }, { data: transportRoutes }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name', { ascending: true }),
    supabase.from('sections').select('id, name, class_id').eq('school_id', schoolId).order('name', { ascending: true }),
    supabase.from('transport_routes').select('id, name, monthly_fee').eq('school_id', schoolId),
  ]);

  return { classes: classes || [], sections: sections || [], transportRoutes: transportRoutes || [] };
}

export { getSignedPhotoUrl as getStudentPhotoUrl } from '@/utils/photos';
