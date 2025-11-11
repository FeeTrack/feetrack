'use server';

import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";

export async function searchStudentAction(prevState, formData) {
    const supabase = await createServerSupabase();
    const profile = await getUser();
    if (!profile) return { error: 'User not found' };

    const admNoQuery = String(formData.get('admNoQuery') ?? '').trim();
    const nameQuery = String(formData.get('nameQuery') ?? '').trim();
    if (!admNoQuery && !nameQuery) return { error: "Please enter a valid admission number or name." }

    if (admNoQuery) {
        const { data: student, error: err } = await supabase
            .from('students')
            .select('id, name, classes(name), sections(name), roll_no, adm_no, academic_sessions(id, name)')
            .eq('school_id', profile.school_id)
            .eq('adm_no', admNoQuery)
            .maybeSingle();
    if (err) return { error: "Error searching student:" + err.message };
    if (!student) return { error: "No student found." };
    return { student };
    } else if (nameQuery) {
        const { data, error: err } = await supabase
            .from('students')
            .select('id, name, classes(name), sections(name), roll_no, adm_no, academic_sessions(id, name)')
            .eq('school_id', profile.school_id)
            .ilike('name', `%${nameQuery}%`)
            .limit(10);
        if (err) return { error: "Error searching students:" + err.message };
        if (data.length === 0) return { error: "No students found." };
        return { students: data };
    }
}