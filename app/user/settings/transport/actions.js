'use server'
import { createServerSupabase } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { getUser } from "@/utils/supabase/supabaseQueries"
import { getCurrentSession } from "@/utils/session/currentSession"

export async function addTransportRoutesAction(school_id, addedRoutes) {
    if (!Array.isArray(addedRoutes) || addedRoutes.length === 0) {
        return { error: 'No routes provided.'}
    }

    const supabase = await createServerSupabase();

    const {count: routeCount, error: countErr} = await supabase
        .from('transport_routes')
        .select('*', {count: 'exact', head: true})
        .eq('school_id', school_id);
    
    if (countErr) {
        return { error: error.message }
    }

    if (routeCount === 0) {
        const {error} = await supabase
            .from('fee_heads')
            .insert({
                school_id, name: 'Transport Fee', duration: 'monthly'
            });

        if (error) {
            return { error: error.message }
        }
    }

    const insertRoutesData = addedRoutes.map(route => ({
        school_id,
        name: route.name,
        monthly_fee: route.monthly_fee,
        vehicle_no: route.vehicle_no
    }))

    const {error} = await supabase
        .from('transport_routes')
        .insert(insertRoutesData);
    
    if (error) {
        return { error: error.message }
    }

    revalidatePath('/user/settings/transport')
    return { success: true }
}

export async function updateTransportRouteAction( formData ) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const supabase = await createServerSupabase();

    const {error} = await supabase
        .from('transport_routes')
        .update({
            name: formData.name, monthly_fee: formData.monthlyFee, vehicle_no: formData.vehicleNo
        })
        .eq('id', formData.id)
        .eq('school_id', profile.school_id);
    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function searchStudentAction(searchQuery) {
    try {
        const profile = await getUser();
        if (!profile) return { error: 'Not authenticated' };

        const supabase = await createServerSupabase();
        const currentSession = await getCurrentSession();

        const query = (searchQuery).trim();
        const admNoQuery = parseInt(query, 10)

        let supabaseQuery = supabase
            .from('students')
            .select('id, name, classes(name), sections(name), roll_no, adm_no, route_id')
            .eq('school_id', profile.school_id)
            .eq('session_id', currentSession?.id)

        if (!isNaN(admNoQuery)) {
            supabaseQuery = supabaseQuery.eq('adm_no', admNoQuery);
        } else {
            supabaseQuery = supabaseQuery.ilike('name', `%${query}%`)
        }

        supabaseQuery = supabaseQuery.limit(10);

        const { data, error: err} = await supabaseQuery;
            
        if (err) {
            console.error('Database query error:', err);
            return { error: err.message };
        }
                
        return { success: true, students: data };
    } catch (error) {
        console.error('Server action error:', error);
        return { error: 'Failed to search students. Please try again.' };
    }
}

async function getTransportFeeHeadId(supabase, schoolId) {
    const { data } = await supabase
        .from('fee_heads')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', 'Transport Fee')
        .maybeSingle();
    return data?.id || null;
}

// The student's transport invoice items in the session. An item is "locked" once any money
// was received against it (or against a late fee charged on it); locked months can't be removed.
async function loadTransportItems(supabase, studentId, feeHeadId, sessionId) {
    const { data: items, error } = await supabase
        .from('invoice_items')
        .select('id, invoice_id, pay_period, amount, amount_paid, invoices!inner(session_id), payment_items(id)')
        .eq('student_id', studentId)
        .eq('fee_head_id', feeHeadId)
        .eq('invoices.session_id', sessionId);
    if (error) return { error: error.message };
    if (!items.length) return { items: [] };

    const { data: lateFees, error: lateFeeErr } = await supabase
        .from('invoice_items')
        .select('id, invoice_id, late_fee_for_invoice_item_id, amount_paid, payment_items(id)')
        .in('late_fee_for_invoice_item_id', items.map(i => i.id));
    if (lateFeeErr) return { error: lateFeeErr.message };

    const isPaid = (item) => Number(item.amount_paid) > 0 || item.payment_items?.length > 0;

    return {
        items: items.map(item => {
            const itemLateFees = (lateFees || []).filter(lf => lf.late_fee_for_invoice_item_id === item.id);
            return {
                id: item.id,
                invoice_id: item.invoice_id,
                pay_period: item.pay_period,
                amount: Number(item.amount),
                locked: isPaid(item) || itemLateFees.some(isPaid),
                lateFees: itemLateFees.map(lf => ({ id: lf.id, invoice_id: lf.invoice_id })),
            };
        })
    };
}

export async function getStudentTransportAction(studentId) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const supabase = await createServerSupabase();
    const currentSession = await getCurrentSession();

    const feeHeadId = await getTransportFeeHeadId(supabase, profile.school_id);
    if (!feeHeadId) return { periods: [] };

    const { items, error } = await loadTransportItems(supabase, studentId, feeHeadId, currentSession.id);
    if (error) return { error };

    // One entry per month; a month is locked if any of its (possibly duplicate) items is locked
    const byPeriod = new Map();
    for (const item of items) {
        const existing = byPeriod.get(item.pay_period);
        byPeriod.set(item.pay_period, {
            pay_period: item.pay_period,
            amount: item.amount,
            locked: Boolean(existing?.locked || item.locked),
        });
    }

    return { periods: [...byPeriod.values()], duplicates: items.length - byPeriod.size };
}

// Brings the student's transport months in line with `payPeriods` for the selected route:
// unpaid months that are no longer wanted (and duplicate items) are deleted, kept unpaid months
// get the route's current fee, and new months are added. Paid months are never touched.
export async function updateStudentTransportAction({ studentId, routeId, payPeriods = [] }) {
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const supabase = await createServerSupabase();
    const currentSession = await getCurrentSession();

    const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('school_id', profile.school_id)
        .maybeSingle();
    if (!student) return { error: 'Student not found.' };

    let route = null;
    if (routeId) {
        const { data } = await supabase
            .from('transport_routes')
            .select('id, monthly_fee')
            .eq('id', routeId)
            .eq('school_id', profile.school_id)
            .maybeSingle();
        if (!data) return { error: 'Transport route not found.' };
        route = data;
    }

    const feeHeadId = await getTransportFeeHeadId(supabase, profile.school_id);
    if (!feeHeadId) return { error: 'Transport Fee head not found. Please add a transport route first.' };

    const { items, error: loadErr } = await loadTransportItems(supabase, studentId, feeHeadId, currentSession.id);
    if (loadErr) return { error: loadErr };

    const wanted = new Set(route ? payPeriods : []);
    const covered = new Set();
    const toDelete = [];
    const toUpdate = [];
    const affectedInvoiceIds = new Set();

    // Paid items first, so an unpaid duplicate of a paid month gets cleaned up
    const ordered = [...items].sort((a, b) => Number(b.locked) - Number(a.locked));
    for (const item of ordered) {
        if (item.locked) {
            covered.add(item.pay_period);
        } else if (wanted.has(item.pay_period) && !covered.has(item.pay_period)) {
            covered.add(item.pay_period);
            if (item.amount !== Number(route.monthly_fee)) {
                toUpdate.push(item);
                affectedInvoiceIds.add(item.invoice_id);
            }
        } else {
            toDelete.push(item);
            affectedInvoiceIds.add(item.invoice_id);
            item.lateFees.forEach(lf => affectedInvoiceIds.add(lf.invoice_id));
        }
    }

    const toAdd = [...wanted].filter(p => !covered.has(p));
    let missingPeriods = [];
    let insertRows = [];

    if (toAdd.length) {
        const { data: invoices, error: invErr } = await supabase
            .from('invoices')
            .select('id, pay_period')
            .eq('school_id', profile.school_id)
            .eq('student_id', studentId)
            .eq('session_id', currentSession.id)
            .in('pay_period', toAdd);
        if (invErr) return { error: invErr.message };

        const invoiceIdMap = new Map(invoices.map(inv => [inv.pay_period, inv.id]));
        missingPeriods = toAdd.filter(p => !invoiceIdMap.has(p));
        insertRows = toAdd.filter(p => invoiceIdMap.has(p)).map(p => ({
            invoice_id: invoiceIdMap.get(p),
            student_id: studentId,
            fee_head_id: feeHeadId,
            amount: route.monthly_fee,
            period_key: p,
            pay_period: p,
        }));
        insertRows.forEach(r => affectedInvoiceIds.add(r.invoice_id));
    }

    if (toDelete.length) {
        // Late fees charged on a removed month go with it
        const lateFeeIds = toDelete.flatMap(item => item.lateFees.map(lf => lf.id));
        if (lateFeeIds.length) {
            const { error } = await supabase.from('invoice_items').delete().in('id', lateFeeIds);
            if (error) return { error: 'Error removing late fees: ' + error.message };
        }
        const { error } = await supabase.from('invoice_items').delete().in('id', toDelete.map(i => i.id));
        if (error) return { error: 'Error removing transport months: ' + error.message };
    }

    if (toUpdate.length) {
        const results = await Promise.all(toUpdate.map(item =>
            supabase.from('invoice_items').update({ amount: route.monthly_fee }).eq('id', item.id)
        ));
        const failed = results.find(r => r.error);
        if (failed) return { error: 'Error updating transport fee: ' + failed.error.message };
    }

    if (insertRows.length) {
        const { error } = await supabase.from('invoice_items').insert(insertRows);
        if (error) return { error: 'Error adding transport months: ' + error.message };
    }

    if (affectedInvoiceIds.size) {
        const { error } = await supabase
            .rpc('recalculate_and_update_totals_for_invoices', { p_invoice_ids: [...affectedInvoiceIds] });
        if (error) return { error: 'Error updating invoice totals: ' + error.message };
    }

    const { error: routeErr } = await supabase
        .from('students')
        .update({ route_id: route?.id || null })
        .eq('id', studentId);
    if (routeErr) return { error: routeErr.message };

    const keptPaid = items.filter(i => i.locked && !wanted.has(i.pay_period)).map(i => i.pay_period);

    return {
        success: true,
        added: insertRows.length,
        removed: toDelete.length,
        keptPaid: [...new Set(keptPaid)],
        missingPeriods,
    };
}
