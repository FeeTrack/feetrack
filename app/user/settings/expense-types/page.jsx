import { getUser } from "@/utils/supabase/supabaseQueries";
import { createServerSupabase } from '@/utils/supabase/server';

import UserLayout from "../../UserLayout";
import ExpenseSetupClient from "./ExpenseSetupClient";
import { redirect } from "next/navigation";

export const metadata = {
    title: 'Expense Types | FeeTrack',
    description: 'The page for expenses setup.'
}

export default async function ExpensesSetupPage() {
    const supabase = await createServerSupabase();

    const profile = await getUser();
    if (!profile) {
        redirect('/login')
    }

    const {data: expense_heads}  = await supabase
        .from('expense_heads')
        .select('id, name, is_salary_head')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false});
        
    return (
        <UserLayout pageName='Expense Types'>
            <ExpenseSetupClient profile={profile} expenseHeads={expense_heads} />
        </UserLayout>
    )
}