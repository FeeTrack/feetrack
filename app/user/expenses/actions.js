'use server'
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";
import { revalidatePath } from "next/cache";

export async function addExpenseAction(prevState, formData) {
    const school_id = formData.get('school_id').trim();
    const session_id = formData.get('session_id').trim();
    const expense_head_id = formData.get('expenseType').trim();
    const is_salary_head = formData.get('isSalaryHead') === 'on' || formData.get('isSalaryHead') === 'true';
    const staff_id = formData.get('selectedStaff')?.trim() || null;
    const amount = Number(formData.get('amount'));
    const expense_date = formData.get('expenseDate').trim();
    const description = formData.get('description').trim();

    const supabase = await createServerSupabase();

    const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
            school_id, session_id, expense_head_id, amount, expense_date, description
        })
        .select('id')
        .single();
    if (error) {
        return { error: error.message };
    }

    if (is_salary_head) {
        const { error } = await supabase
            .from('salary_expenses')
            .insert({
                expense_id: expense.id, staff_id: staff_id
            });
        if (error) {
            return { error: error.message };
        }
    }

    revalidatePath('/user/expenses')
    return { success: true }
}

export async function updateExpenseAction(prevState, formData) {
    const expense_id = formData.get('expenseId');
    const expense_head_id = formData.get('expenseType').trim();
    const is_salary_head = formData.get('isSalaryHead') === 'on' || formData.get('isSalaryHead') === 'true';
    const staff_id = formData.get('selectedStaff')?.trim() || null;
    const amount = Number(formData.get('amount'));
    const expense_date = formData.get('expenseDate').trim();
    const description = formData.get('description').trim();

    const supabase = await createServerSupabase();

    const { error } = await supabase
        .from('expenses')
        .update({
            expense_head_id, amount, expense_date, description
        })
        .eq('id', expense_id);
    if (error) {
        return {error: error.message}
    }

    if (is_salary_head) {
        const { error } = await supabase
            .from('salary_expenses')
            .update({
                staff_id
            })
            .eq('expense_id', expense_id);
        if (error) {
            return { error: error.message }
        }
    }

    return { success: true }    
}

export async function filterExpensesAction(prevState, formData) {
    const fromDate = formData.get('from_date');
    const toDate = formData.get('to_date');
    const expenseHeadId = formData.get('expenseType');
    console.log(expenseHeadId)

    const supabase = await createServerSupabase();
    const profile = await getUser();

    let filterQuery = supabase
        .from('expenses')
        .select('id, expense_heads!inner(id, name, is_salary_head), amount, expense_date, description, salary_expenses(staff(id, name))')
        .eq('school_id', profile.school_id);

    if (expenseHeadId) {
        filterQuery = filterQuery.eq('expense_heads.id', expenseHeadId)
    }

    
    filterQuery = filterQuery
        .gte('expense_date', fromDate)
        .lte('expense_date', toDate)
        .order('expense_date', {ascending: false});

    const { data: filteredExpensesResponse, error } = await filterQuery;

    if (error) {
        return { error: error.message };
    }

    console.log(filteredExpensesResponse)

    return { success: true, filteredExpensesResponse}    
}