'use server'
import { createServerSupabase } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { months } from "@/utils/constants/backend"

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
    const supabase = await createServerSupabase();

    const {error} = await supabase
        .from('transport_routes')
        .update({
            name: formData.name, monthly_fee: formData.monthlyFee, vehicle_no: formData.vehicleNo
        })
        .eq('id', formData.id);
    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function searchStudentAction(school_id, searchQuery) {
    try {
        const supabase = await createServerSupabase();
        
        if (!supabase) {
            return { error: 'Failed to initialize database connection' };
        }
        
        const query = (searchQuery).trim();
        const admNoQuery = parseInt(query, 10)
        
        let supabaseQuery = supabase
            .from('students')
            .select('id, name, classes(name), sections(name), roll_no, adm_no, route_id')
            .eq('school_id', school_id)

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

export async function manageStudentTransportAction(formData) {
    const supabase = await createServerSupabase();

    const schoolId = formData.school_id;
    const studentId = formData.student_id;
    const currentSession = formData.current_session;
    const selectedRoute = formData.selected_route;
    const transFeeHeadId = formData.trans_fee_head_id;
    const selectedPayPeriods = formData.pay_periods;
    const existingPayPeriods = formData.existing_pay_periods;

    if (formData.existing_route_id) {
        const {data: transportPaidPeriods, error: transPaidErr} = await supabase
            .from('payment_items')
            .select('invoice_items!inner(pay_period)')
            .eq('invoice_items.fee_head_id', transFeeHeadId);
        if (transPaidErr) {
            return { error: transPaidErr.message }
        }

        const paidTransportPeriods = Array.from(new Set(transportPaidPeriods.map(t => t.invoice_items?.pay_period))) || [];

        const toBeDeletedPayPeriods = existingPayPeriods.filter(e => !paidTransportPeriods.includes(e))

        const {error: invItemDeleteErr} = await supabase
            .from('invoice_items')
            .delete()
            .eq('student_id', studentId)
            .eq('fee_head_id', transFeeHeadId)
            .in('pay_period', toBeDeletedPayPeriods);
        if (invItemDeleteErr) {
            console.log(invItemDeleteErr)
            return { error: invItemDeleteErr.message}
        }

        const {error: setRouteNullErr} = await supabase
            .from('students')
            .update({
                route_id: null
            })
            .eq('id', studentId);
        if (setRouteNullErr) {
            return { error: setRouteNullErr.message }
        }
    }

    if (selectedRoute) {
        const {error: routeIdUpdtErr} = await supabase
            .from('students')
            .update({
                route_id: selectedRoute.id
            })
            .eq('id', studentId);
        if (routeIdUpdtErr) {
            return { error: routeIdUpdtErr.message }
        }
        
        const {data: invoices, error: invErr} = await supabase
            .from('invoices')
            .select('id, pay_period')
            .eq('school_id', schoolId)
            .eq('student_id', studentId)
            .eq('session_id', currentSession.id);
    
            if (invErr) {
            return { error: invErr.message }
        }
    
        const invoiceIdMap = new Map(invoices.map(inv => [inv.pay_period, inv.id]));
    
        const transportInvItemsPayloads = []
    
        for (const p of selectedPayPeriods) {
            transportInvItemsPayloads.push({
                student_id: studentId,
                fee_head_id: transFeeHeadId,
                amount: selectedRoute.monthly_fee,
                period_key: p,
                pay_period: p,
            })
        }
    
        const finalTransInvItemsPayloads = transportInvItemsPayloads.map(item => {
            const invoiceId = invoiceIdMap.get(item.pay_period);
            return {
                ...item,
                invoice_id: invoiceId
            }
        })
    
        const {error: transInvItemInsertErr} = await supabase
            .from('invoice_items')
            .insert(finalTransInvItemsPayloads);
    
        if (transInvItemInsertErr) {
            console.error(transInvItemInsertErr.message)
            if (transInvItemInsertErr.code === '23505') {
                return { error: { message: 'Cannot create duplicate transport invoices for a single month.', code: '23505'}}
            } else {
                return { error: transInvItemInsertErr.message }
            }
        }
    
        // Recompute total amounts for affected invoices
        const uniqueInvoiceIds = invoices.map(i => i.id);
    
        const { error } = await supabase
            .rpc('recalculate_and_update_totals_for_invoices', { p_invoice_ids: uniqueInvoiceIds });
    
        if (error) {
            return { error: 'Error updating invoice totals: ' + error.message };
        }
    }

    return { success: true }
}