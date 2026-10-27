'use server';
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";
import { getCurrentSession } from "@/utils/session/currentSession";

// Dates are entered in India; build the day boundaries in IST so a server running in UTC doesn't shift them
const istDayStart = (date) => new Date(`${date}T00:00:00+05:30`).toISOString();
const istDayEnd = (date) => new Date(`${date}T23:59:59.999+05:30`).toISOString();

export async function filterPaymentsAction(prevState, formData) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const get = (key) => String(formData.get(key) ?? '').trim();
    const fromDate = get('from_date');
    const toDate = get('to_date');
    const classId = get('class');
    const sectionId = get('section');
    const receiptNo = get('receipt_no');

    if (!fromDate && !toDate && !classId && !receiptNo) {
        return { error: 'Please enter at least one filter.' };
    }

    const supabase = await createServerSupabase();
    const currentSession = await getCurrentSession();

    let query = supabase
        .from('payments')
        .select('id, receipt_no, students!inner(id, name, adm_no, class_id, section_id, classes(name), sections(name)), amount, created_at, session_id, method, transaction_id')
        .eq('school_id', profile.school_id)
        .eq('session_id', currentSession?.id);

    if (fromDate) query = query.gte('created_at', istDayStart(fromDate));
    if (toDate) query = query.lte('created_at', istDayEnd(toDate));
    if (classId) query = query.eq('students.class_id', classId);
    if (sectionId) query = query.eq('students.section_id', sectionId);
    if (receiptNo) {
        // "2026/15" matches exactly; "15" matches the serial part of any receipt this session
        query = receiptNo.includes('/')
            ? query.eq('receipt_no', receiptNo)
            : query.like('receipt_no', `%/${receiptNo}`);
    }

    const { data: filteredPayments, error } = await query.order('created_at', { ascending: false });
    if (error) {
        return { error: 'Failed to fetch payments. ' + (error.message || '') };
    }
    return { filteredPaymentsResponse: filteredPayments, status: 'success' };
}
