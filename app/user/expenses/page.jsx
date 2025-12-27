import { getUser, checkFeatureAccess } from "@/utils/supabase/supabaseQueries";
import { createServerSupabase } from '@/utils/supabase/server';

import UserLayout from "../UserLayout";
import ExpensesClient from "./ExpensesClient";
import { redirect } from "next/navigation";

export const metadata = {
    title: 'Expenses | FeeTrack',
    description: 'The page to view and manage expenses.'
}

export default async function ExpensesPage() {
    const profile = await getUser();
    if (!profile) {
        redirect('/login')
    }

    const accessCheck = await checkFeatureAccess(profile.school_id, 'expensesModule')
    if (!accessCheck.allowed) {
        return (
            <UserLayout pageName='Expenses'>
            <div className="w-full h-full flex justify-center items-center">
                <h1>This feature is not available in your current plan. Kindly upgrade to access this feature.</h1>
            </div>
            </UserLayout>
        )
    }

    const supabase = await createServerSupabase();

    const {data: expense_heads} = await supabase
        .from('expense_heads')
        .select('id, name, is_salary_head')
        .eq('school_id', profile.school_id);
    
    const {data: staff} = await supabase
        .from('staff')
        .select('id, name, salary')
        .eq('school_id', profile.school_id);

    const { data: currentSession } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    const {data: recent_expenses}  = await supabase
        .from('expenses')
        .select('id, expense_heads(id, name, is_salary_head), amount, expense_date, description, salary_expenses(staff(id, name))')
        .eq('school_id', profile.school_id)
        .eq('session_id', currentSession?.id)
        .order('expense_date', { ascending: false})
        .limit(10);
        
    return (
        <UserLayout pageName='Expenses'>
            <ExpensesClient profile={profile} expenseTypes={expense_heads} staff={staff} recentExpenses={recent_expenses} />
        </UserLayout>
    )
}