// app/dashboard/students/actions.js
'use server';
import { createServerSupabase } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/utils/supabase/supabaseQueries';

import { createInvoicesForStudent } from '@/utils/billing/createInvoicesForStudent';

export async function createStudentAction(prevState, formData) {
  const supabase = await createServerSupabase()
  const profile = await getUser();
  if (!profile) return { error: 'Not authenticated' };

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Student name is required.' };

  const className = String(formData.get('class') ?? '').trim();
  if (!className) return { error: 'Class is required.' };

  const section = String(formData.get('section') ?? '').trim();
  if (!section) return { error: 'Section is required.' };

  const adm_no = String(formData.get('adm_no') ?? '').trim();
  const rollNo = String(formData.get('roll_no') ?? '').trim();

  const father_name = String(formData.get('father_name') ?? '').trim();
  const mother_name = String(formData.get('mother_name') ?? '').trim();

  const parent_mobile = String(formData.get('parent_mobile') ?? '').trim();
  if (!parent_mobile) return { error: 'parent_mobile contact is required.' };

  const currentSession = JSON.parse(formData.get('session'));
  if (!currentSession) return { error: 'Academic session is required.' };
  const session_id = currentSession.id;

  let adm_date = new Date(formData.get('adm_date') ?? '');
  if (isNaN(adm_date)) return { error: 'Invalid admission date.' };
  adm_date = adm_date.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const month_fee_from = String(formData.get('month_fee_from') ?? '').trim();
  if (!month_fee_from) return { error: 'Please select when to apply monthly fees from.' };

  const gen_fee = formData.get('gen_fee') === 'on' || formData.get('gen_fee') === 'true';
  if (gen_fee) {
    // check if class has fee structure
    const { data: classFeeStruct, error: classFeeErr } = await supabase
      .from('fee_structures')
      .select('id')
      .eq('session_id', session_id)
      .eq('class_id', className)
      .limit(1)
      .single();

    if (classFeeErr || !classFeeStruct) {
      return { error: 'Fee Structure not found for the selected class. Please set up fees in the settings to apply fees.' };
    }
  }

  // insert student with server-side school_id (prevents tampering)
  const { data: student, error } = await supabase
    .from('students')
    .insert({
      name,
      class_id: className,
      section_id: section,
      adm_no: adm_no,
      roll_no: rollNo || null,
      father_name: father_name || null,
      mother_name: mother_name || null,
      parent_mobile: parent_mobile || null,
      school_id: profile.school_id,
      session_id,
      adm_date,
      month_fee_from,
      type: 'new',
    })
    .select()
    .single();

  if (error) {
    const constraint = error.message.match(/constraint "(.*)"/)?.[1];
    if (constraint === "unique_roll_no_per_school_class_section") {
      const friendlyMessage = "A student with this roll number already exists.";
      return { error: friendlyMessage };
    }

    return { error: "Failed to add student. " + error.message };
  }

  if (gen_fee) {
    // create invoices for student based on class fee structure
    const error = await createInvoicesForStudent({student, currentSession});
    if (error) {
      return { error: 'Student added, but failed to generate invoices. ' + error.error };
    }
  }

  revalidatePath('/user/students');
  return { student, status: 'success', message: `Successfully Added Student: ${student.name}` };
}

export async function updateStudentAction(prevState, formData) {
  const supabase = await createServerSupabase()

  const studentId = String(formData.get('studentId') ?? '').trim();
  if (!studentId) {
    return { error: 'Please select a student.' };
  }
  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    return { error: 'Student name is required.' };
  }
  const className = String(formData.get('class') ?? '').trim();
  const section = String(formData.get('section') ?? '').trim();
  const rollNo = String(formData.get('roll_no') ?? '').trim();
  const father_name = String(formData.get('father_name') ?? '').trim();
  const mother_name = String(formData.get('mother_name') ?? '').trim();
  const parent_mobile = String(formData.get('parent_mobile') ?? '').trim();

  let adm_date = new Date(formData.get('adm_date') ?? '');
  if (isNaN(adm_date)) return { error: 'Invalid admission date.' };
  adm_date = adm_date.toISOString().slice(0, 10);

  // update student with server-side school_id (prevents tampering)
  const { data, error } = await supabase
    .from('students')
    .update({
      name,
      class_id: className || null,
      section_id: section || null,
      roll_no: rollNo || null,
      father_name: father_name || null,
      mother_name: mother_name || null,
      parent_mobile: parent_mobile || null,
      adm_date,
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    return { error: 'Failed to update student. ' + (error.message || '') };
  }

  revalidatePath('/user/students');
  return { student: data, status: 'success', message: `Successfully Edited Student: ${data.name}` };
}

export async function leftOutStudentAction(studentId) {
  const supabase = await createServerSupabase()

  if (!studentId) {
    return { error: 'Please select a student.' };
  }
  const { error } = await supabase
    .from('students')
    .update({
      status: 'left_tc',
    })
    .eq('id', studentId);
  if (error) {
    return { error: 'Failed to mark student as left-out. ' + (error.message || '') };
  }
  revalidatePath('/user/students');
  return { success: true };
}

export async function filterStudentsAction(prevState, formData) {
  const profile = await getUser();
  if (!profile) return { error: 'Not authenticated' };

  const supabase = await createServerSupabase();

  const classId = String(formData.get('class') ?? '').trim();
  if (!classId) { return { error: 'Class is required.' }; }

  const currentSessionId = String(formData.get('currentSession') ?? '').trim();
  if (!currentSessionId) { return { error: 'Academic session is required.' }; }

  const studentsQuery = supabase
    .from('students')
    .select('id, name, adm_no, roll_no, classes(name), sections(name), father_name, mother_name, parent_mobile, class_id, section_id, adm_date, type, status, month_fee_from')
    .eq('school_id', profile.school_id)
    .eq('session_id', currentSessionId)
    .eq('class_id', classId);

  const sectionId = String(formData.get('section') ?? '').trim();
  if (sectionId) {
    studentsQuery.eq('section_id', sectionId);
  }

  const studentType = String(formData.get('studentType') ?? '').trim();
  if (studentType) {
    studentsQuery.eq('type', studentType);
  }

  const studentStatus = String(formData.get('studentStatus') ?? '').trim();
  if (studentStatus) {
    studentsQuery.eq('status', studentStatus);
  }

  const { data: filteredStudents, error } = await studentsQuery;

  if (error) {
    return { error: 'Error fetching students: ' + error.message };
  }

  return { filteredStudentsResponse: filteredStudents, status: 'success' };
}