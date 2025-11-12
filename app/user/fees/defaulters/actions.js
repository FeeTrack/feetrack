'use server'
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";

export async function searchDefaultersAction(prevState, formData) {
    try {
        const profile = await getUser();
        if (!profile) {
            return {error: "User not authenticated"};
        }

        const supabase = await createServerSupabase();

        const payPeriods = formData.getAll('pay_periods');

        if (payPeriods.length === 0) {
            return { error: 'Please select at least one month.' };
        }

        const classId = String(formData.get('classId')).trim();
        if (!classId || classId === 'undefined') {
            return { error: 'Please select a class.' };
        }

        const sectionId = String(formData.get('sectionId')).trim();

        let invoiceQuery = supabase
            .from('invoices')
            .select(`id, students!inner(id, name, classes(name), sections(name), adm_no, roll_no, parent_mobile), pay_period, amount, amount_paid, schools(name)`)
            .eq('school_id', profile.school_id)
            .eq('students.class_id', classId)
            .in('pay_period', payPeriods)
            .eq('status', 'pending');

        if (sectionId && sectionId !== 'undefined') {
            invoiceQuery = invoiceQuery.eq('students.section_id', sectionId);
        }

        const { data: invoices, error: invoiceError } = await invoiceQuery;

        if (invoiceError) {
            return { error: 'Error fetching invoices: ' + invoiceError.message };
        }

        if (!invoices || invoices.length === 0) {
            return { defaulters: [], payPeriods: payPeriods };
        }

        const invoiceIds = invoices.map(inv => inv.id);

        const schName = invoices?.[0].schools?.name;

        const { data: lateFees, error: lateFeeError } = await supabase
            .from('invoice_items')
            .select('invoice_id, amount')
            .in('invoice_id', invoiceIds)
            .eq('is_late_fee', true);

        if (lateFeeError) {
            return { error: 'Error fetching late fees: ' + lateFeeError.message };
        }

        const { data: discounts, error: discountError } = await supabase
            .from('discounts')
            .select(`amount, payment_items!inner(invoice_items!inner(invoice_id, pay_period))`)
            .in('payment_items.invoice_items.invoice_id', invoiceIds);

        if (discountError) {
            return { error: 'Error fetching discounts: ' + discountError.message };
        }

        const lateFeeMap = {};
        lateFees?.forEach(lf => {
            if (!lateFeeMap[lf.invoice_id]) {
                lateFeeMap[lf.invoice_id] = 0;
            }
            lateFeeMap[lf.invoice_id] += Number(lf.amount);
        });

        const discountMap = {};
        discounts?.forEach(d => {
            const invoiceId = d.payment_items.invoice_items.invoice_id;
            if (!discountMap[invoiceId]) {
                discountMap[invoiceId] = 0;
            }
            discountMap[invoiceId] += Number(d.amount);
        });

        const defaultersMap = {};

        invoices.forEach(invoice => {
            const studentId = invoice.students.id;

            if (!defaultersMap[studentId]) {
                defaultersMap[studentId] = {
                    student: {
                        id: invoice.students.id,
                        name: invoice.students.name,
                        adm_no: invoice.students.adm_no,
                        roll_no: invoice.students.roll_no,
                        parent_mobile: invoice.students.parent_mobile,
                        class_name: invoice.students.classes?.name || '',
                        section_name: invoice.students.sections?.name || ''
                    },
                    periods: []
                };
            }

            const student = defaultersMap[studentId];
            const total = Number(invoice.amount) - (lateFeeMap[invoice.id] || 0);
            const fine = lateFeeMap[invoice.id] || 0;
            const paid = Number(invoice.amount_paid);
            const discount = discountMap[invoice.id] || 0;

            student.periods.push({
                pay_period: String(invoice.pay_period.split('-')[0]),
                total: Number(total),
                fine: Number(fine),
                paid: Number(paid),
                discount: Number(discount),
                balance: Number(total + fine - paid - discount)
            });
        });

        const defaulters = Object.values(defaultersMap).map(item => ({
            schoolName: schName,
            student: item.student,
            periods: item.periods,
            grandTotal: Number(item.periods.reduce((sum, p) => sum + p.total, 0)),
            grandFine: Number(item.periods.reduce((sum, p) => sum + p.fine, 0)),
            grandPaid: Number(item.periods.reduce((sum, p) => sum + p.paid, 0)),
            grandDiscount: Number(item.periods.reduce((sum, p) => sum + p.discount, 0)),
            grandBalance: Number(item.periods.reduce((sum, p) => sum + p.balance, 0))
        }));
        
        // Serialize to plain objects using JSON parse/stringify
        return JSON.parse(JSON.stringify({
            defaulters: defaulters,
        }));

    } catch (error) {
        console.error('Server action error:', error);
        return { error: 'An unexpected error occurred: ' + error.message };
    }
}