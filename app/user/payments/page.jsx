import { getUser } from "@/utils/supabase/supabaseQueries";
import { createServerSupabase } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import UserLayout from '../UserLayout';
import PaymentsClient from "./PaymentsClient";

export const metadata = {
    title: 'Payments | FeeTrack',
    description: 'Lists the payments recorded.'
}

export default async function PaymentsPage() {
    const profile = await getUser();
    if (!profile) {
        redirect('/login');
    }

    const supabase = await createServerSupabase();

    const {data: currentSession} = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('is_active', true)
        .single();
    
    const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, receipt_no, students(id, name, adm_no, classes(name), sections(name)), amount, created_at, session_id, method, transaction_id ')
        .eq('school_id', profile.school_id)
        .eq('session_id', currentSession?.id)
        .order('created_at', { ascending: false })
        .limit(10);
    
    return (
        <UserLayout pageName='Payments'>
            <PaymentsClient recentPayments={recentPayments} />
        </UserLayout>
    );
}
