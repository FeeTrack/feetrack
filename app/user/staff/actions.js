'use server';
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser, checkFeatureLimit } from "@/utils/supabase/supabaseQueries";
import { revalidatePath } from "next/cache";
import { STUDENT_PHOTOS_BUCKET, MAX_PHOTO_BYTES, genders } from "@/utils/constants/students";

function parseStaffFields(formData) {
    const get = (key) => String(formData.get(key) ?? '').trim();

    const name = get('name');
    if (!name) return { error: 'Staff name is required.' };

    const designation = get('designation');
    if (!designation) return { error: 'Designation is required.' };

    const gender = get('gender');
    if (!genders.some(g => g.value === gender)) return { error: 'Gender is required.' };

    const joining_date = get('joining_date');
    if (!joining_date || isNaN(new Date(joining_date))) return { error: 'Joining date is required.' };

    const mobile_no = get('mobile_no');
    if (mobile_no && !/^\d{10}$/.test(mobile_no)) return { error: 'Mobile No. must be 10 digits.' };

    const aadhaar_no = get('aadhaar_no');
    if (aadhaar_no && !/^\d{12}$/.test(aadhaar_no)) return { error: 'Aadhaar No. must be 12 digits.' };

    const salary = get('salary');
    if (salary && (isNaN(Number(salary)) || Number(salary) < 0)) return { error: 'Salary must be a valid amount.' };

    return {
        fields: {
            name,
            designation,
            gender,
            joining_date,
            mobile_no: mobile_no || null,
            aadhaar_no: aadhaar_no || null,
            salary: salary ? Number(salary) : null,
            dob: get('dob') || null,
            email: get('email') || null,
            qualification: get('qualification') || null,
            address: get('address') || null,
        }
    };
}

function getPhoto(formData) {
    const photo = formData.get('photo');
    if (!photo || typeof photo === 'string' || photo.size === 0) return { photo: null };
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) return { error: 'Photo must be a JPG, PNG or WebP image.' };
    if (photo.size > MAX_PHOTO_BYTES) return { error: 'Photo must be 100 KB or smaller.' };
    return { photo };
}

// Staff photos sit in the same private bucket as student photos, under <school_id>/staff/
async function uploadStaffPhoto(supabase, schoolId, staffId, photo) {
    const path = `${schoolId}/staff/${staffId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
        .from(STUDENT_PHOTOS_BUCKET)
        .upload(path, photo, { contentType: photo.type });
    return { path, error };
}

export async function addStaffAction(prevState, formData) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const limitCheck = await checkFeatureLimit(profile.school_id, 'staff')
    if (!limitCheck.allowed) {
        return { error: { message: 'Staff limit reached. Please upgrade your plan to add more staff.'}}
    }

    const parsed = parseStaffFields(formData);
    if (parsed.error) return { error: parsed.error };

    const { photo, error: photoError } = getPhoto(formData);
    if (photoError) return { error: photoError };

    const supabase = await createServerSupabase();

    const { data: staff, error } = await supabase
        .from('staff')
        .insert({ school_id: profile.school_id, ...parsed.fields })
        .select()
        .single();
    if (error) {
        return { error: 'Failed to add staff. ' + error.message };
    }

    let warning = null;
    if (photo) {
        const { path, error: uploadError } = await uploadStaffPhoto(supabase, profile.school_id, staff.id, photo);
        if (uploadError) {
            warning = 'Photo could not be uploaded. ' + uploadError.message;
        } else {
            await supabase.from('staff').update({ photo_path: path }).eq('id', staff.id);
        }
    }

    revalidatePath('/user/staff')
    return { staff, status: 'success', message: `Successfully added staff: ${staff.name}`, warning };
}

export async function updateStaffAction(prevState, formData) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const staffId = String(formData.get('staff_id') ?? '').trim();
    if (!staffId) return { error: 'Staff ID is required.' };

    const parsed = parseStaffFields(formData);
    if (parsed.error) return { error: parsed.error };

    const { photo, error: photoError } = getPhoto(formData);
    if (photoError) return { error: photoError };
    const removePhoto = formData.get('remove_photo') === 'true';

    const supabase = await createServerSupabase();

    const { data: existing } = await supabase
        .from('staff')
        .select('photo_path')
        .eq('id', staffId)
        .eq('school_id', profile.school_id)
        .maybeSingle();
    if (!existing) return { error: 'Staff not found.' };

    let photo_path = existing.photo_path;
    let warning = null;

    if (photo) {
        const { path, error: uploadError } = await uploadStaffPhoto(supabase, profile.school_id, staffId, photo);
        if (uploadError) {
            warning = 'Photo could not be uploaded. ' + uploadError.message;
        } else {
            photo_path = path;
        }
    } else if (removePhoto) {
        photo_path = null;
    }

    const { data: staff, error } = await supabase
        .from('staff')
        .update({ ...parsed.fields, photo_path })
        .eq('id', staffId)
        .eq('school_id', profile.school_id)
        .select()
        .single();
    if (error) {
        return { error: 'Failed to update staff. ' + error.message };
    }

    // Old photo is only removed once the staff row points at the new one
    if (existing.photo_path && existing.photo_path !== photo_path) {
        await supabase.storage.from(STUDENT_PHOTOS_BUCKET).remove([existing.photo_path]);
    }

    revalidatePath('/user/staff')
    return { staff, status: 'success', message: `Successfully updated staff: ${staff.name}`, warning };
}

export async function deleteStaffAction(staffId) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const supabase = await createServerSupabase();

    const { data: staff, error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)
        .eq('school_id', profile.school_id)
        .select('photo_path')
        .maybeSingle();

    if (error) {
        if (error.code === '23503') {
            return { error: 'Cannot delete this staff member because salary expenses are recorded against them.' };
        }
        return { error: 'Failed to delete staff. ' + error.message };
    }

    if (staff?.photo_path) {
        await supabase.storage.from(STUDENT_PHOTOS_BUCKET).remove([staff.photo_path]);
    }

    revalidatePath('/user/staff')
    return { success: true };
}
