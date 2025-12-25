'use server'

import { createServerSupabase } from "@/utils/supabase/server"
import { createBulkInvoicesForStudents } from "@/utils/billing/createBulkInvoicesForStudents"

export async function migrateStudentAction(formData) {
    const supabase = await createServerSupabase()
    const currentSession = formData.currentSession
    const fromSessionId = formData.fromSessionId
    const toSessionId = formData.toSessionId

    if (formData.genFee || fromSessionId === toSessionId) {
        const { data: newSessionExistingInvoices, error: invErr } = await supabase
            .from('invoices')
            .select('id')
            .eq('school_id', formData.schoolId)
            .eq('session_id', formData.toSessionId)
            .in('student_id', formData.studentIds)
        if (invErr) {
            console.error(invErr)
            return { error: invErr.message }
        }

        if (newSessionExistingInvoices.length) {
            const invoiceIds = newSessionExistingInvoices.map(i => i.id)

            const { error: invItemDeleteErr } = await supabase
                .from('invoice_items')
                .delete()
                .in('invoice_id', invoiceIds)
            
            if (invItemDeleteErr) {
                if (invItemDeleteErr.hint === 'Key is still referenced from table "payment_items".') {
                    console.error(invItemDeleteErr)
                    return { error: { message: 'Payment records exist for these students in the new session. Please delete payment records to generate fresh invoices.'}}
                } else {
                    console.error(invItemDeleteErr)
                    return { error: invItemDeleteErr.message }
                }
            }

            const { error: invDeleteErr } = await supabase
                .from('invoices')
                .delete()
                .eq('session_id', formData.toSessionId)
                .in('student_id', formData.studentIds)
            
            if (invDeleteErr) {
                console.error(invDeleteErr)
                return { error: invDeleteErr.message }
            }
        }
    }

    const studentMigrations = formData.studentIds.map(s => (
        supabase
            .from('students')
            .update({
                session_id: formData.toSessionId,
                class_id: formData.toClassId,
                section_id: formData.toSectionId || null
            })
            .eq('school_id', formData.schoolId)
            .eq('id', s)
    ))

    const results = await Promise.all(studentMigrations)

    const errors = results.filter(r => r.error)

    if (errors.length) {
        console.log('Error migrating students: ' + errors.map(e => JSON.stringify(e.message)).join(', '))
        return { error: errors.map(e => JSON.stringify(e.message)).join(', ')}
    }

    const { data: students, error: studentErr } = await supabase
        .from('students')
        .select('*')
        .in('id', formData.studentIds);

    if (studentErr) {
        console.error(studentErr)
        return { error: studentErr.message }
    }

    const res = await createBulkInvoicesForStudents({students, currentSession})
    if (res.error) {
        console.error(res.error)
        return { error: { message: 'Students inserted but failed to generate fee.' } }
    } else if (res.success) {
        return { success: true }
    }

    return { success: true }
}