'use server';
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";
import { revalidatePath } from "next/cache";

export async function addStaffAction(prevState, formData) {
    const name = formData.get('name').trim();
    const designation = formData.get('designation').trim();
    const mobile_no = formData.get('mobile_no').trim();
    let salary = formData.get('salary').trim();

    if (salary) {
        salary = Number(salary);
    }

    const supabase = await createServerSupabase();
    const profile = await getUser();

    const {error} = await supabase
        .from('staff')
        .insert({
            school_id: profile.school_id, name, designation, mobile_no, salary
        });
    if (error) {
        return { error: error.message };
    }

    revalidatePath('/user/staff')
    return { success: true}
}

export async function updateStaffAction(prevState, formData) {
    const staff_id = formData.get('staff_id').trim();
    if (!staff_id) {
        return { error: 'Staff ID is required.' };
    }

    const name = formData.get('name').trim();
    const designation = formData.get('designation').trim();
    const mobile_no = formData.get('mobile_no').trim();
    let salary = formData.get('salary').trim();

    if (salary) {
        salary = Number(salary)
    }

    const supabase = await createServerSupabase();

    const {error} = await supabase
        .from('staff')
        .update({
            name, designation, mobile_no, salary
        })
        .eq('id', staff_id);
    if (error) {
        return { error: error.message };
    }

    return { success: true}
}