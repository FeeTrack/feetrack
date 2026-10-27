import { createServerSupabase } from '@/utils/supabase/server';
import { STUDENT_PHOTOS_BUCKET } from '@/utils/constants/students';

// Student and staff photos share one private bucket, under <school_id>/...,
// so pages get a short-lived signed URL to show them
export async function getSignedPhotoUrl(photoPath) {
  if (!photoPath) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase.storage.from(STUDENT_PHOTOS_BUCKET).createSignedUrl(photoPath, 60 * 60);
  return data?.signedUrl || null;
}
