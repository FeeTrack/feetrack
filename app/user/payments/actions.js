'use server';
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";

export async function filterPaymentsAction(prevState, formData) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const supabase = await createServerSupabase();

    const fd = new Date(formData.get('from_date'));
    if (!fd) { return { error: 'From date is required.' }; }
    fd.setHours(0, 0, 0, 0);

    const td = new Date(formData.get('to_date'));
    if (!td) { return { error: 'To date is required.' }; }
    td.setHours(23, 59, 59, 999);

    const fromDateString = fd.toISOString();
    const toDateString = td.toISOString();

    const { data: filteredPayments, error } = await supabase
        .from('payments')
        .select('id, receipt_no, students(id, name, adm_no, classes(name), sections(name)), amount, created_at, session_id, method, transaction_id')
        .eq('school_id', profile.school_id)
        .gte('created_at', fromDateString)
        .lte('created_at', toDateString)
        .order('created_at', { ascending: false });
    if (error) {
        return { error: 'Failed to fetch payments. ' + (error.message || '') };
    }
    return { filteredPaymentsResponse: filteredPayments, status: 'success' };
}