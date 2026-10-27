import { getUser } from "@/utils/supabase/supabaseQueries";
import { createServerSupabase } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/utils/session/currentSession";

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

    const currentSession = await getCurrentSession();
    
    const [{ data: recentPayments }, { data: classes }, { data: sections }] = await Promise.all([
        supabase
            .from('payments')
            .select('id, receipt_no, students(id, name, adm_no, classes(name), sections(name)), amount, created_at, session_id, method, transaction_id ')
            .eq('school_id', profile.school_id)
            .eq('session_id', currentSession?.id)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase.from('classes').select('id, name').eq('school_id', profile.school_id).order('name', { ascending: true }),
        supabase.from('sections').select('id, name, class_id').eq('school_id', profile.school_id).order('name', { ascending: true }),
    ]);

    return (
        <UserLayout pageName='Payments'>
            <PaymentsClient profile={profile} recentPayments={recentPayments} classes={classes || []} sections={sections || []} />
        </UserLayout>
    );
}
