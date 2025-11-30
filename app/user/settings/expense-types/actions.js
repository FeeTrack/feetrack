'use server'
import { createServerSupabase } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addExpenseHeadAction(prevState, formData) {
    const school_id = formData.get('school_id');
    if (!school_id) {
        return { error: 'Missing school ID.'}
    }
    const name = formData.get('name').trim();
    const is_salary_head = formData.get('is_salary_head') === 'on' || formData.get('is_salary_head') === 'true';

    const supabase = await createServerSupabase();

    const {error} = await supabase
        .from('expense_heads')
        .insert({
            school_id, name, is_salary_head
        });
    if (error) {
        return { error: error.message };
    }

    revalidatePath('/user/settings/expense-types')
    return{ success: true }
}

export async function updateExpenseHeadAction(prevState, formData) {
    const expense_head_id = formData.get('expense_head_id');
    if (!expense_head_id) {
        return { error: "Expense head ID is required." }
    } 
    const name = formData.get('name').trim();
    const is_salary_head = formData.get('is_salary_head') === 'on' || formData.get('is_salary_head') === 'true';

    const supabase = await createServerSupabase();

    const {error} = await supabase
        .from('expense_heads')
        .update({
            name, is_salary_head
        })
        .eq('id', expense_head_id);
    if (error) {
        return { error: error.message }
    }

    return { success: true }
}