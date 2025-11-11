import { createServerSupabase } from "../supabase/server";
import { getUser } from "../supabase/supabaseQueries";
import { months } from "../constants/backend";

export async function createInvoicesForStudent({student, currentSession}) {
    const supabase = await createServerSupabase();
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated.' };

    // Fetch fee structures applicable to the student's class
    const { data: classFeeStructure, error: cfsError } = await supabase
        .from('fee_structures')
        .select('id, fee_heads(id, name, duration), amount')
        .eq('session_id', currentSession.id)
        .eq('class_id', student.class_id);

    if (cfsError) {
        return { error: 'Failed to fetch fee structures.' + cfsError.message };
    }
    if (classFeeStructure.length === 0) {
        return { error: 'No fee structures found for this class and session.' };
    }

    const sessionStartYear = Number(currentSession.name.split('-')[0]);

    // Compute month period key
    const monthToPeriodKey = (monthName, monthNumber) => {
        const year = (monthNumber >= 4) ? sessionStartYear : sessionStartYear + 1;
        return `${monthName}-${year}`
    }

    // half-yearly period keys
    const halfYearlyKeys = [ {periodKey: `HalfYear1-${sessionStartYear}`, payPeriod: `Apr-${sessionStartYear}`}, {periodKey: `HalfYear2-${sessionStartYear}`, payPeriod: `Oct-${sessionStartYear}`} ]

    const yearlyKey = `${sessionStartYear}-${sessionStartYear + 1}`


    function formatDateISO(date) {
        return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
    }

    function addMonthsPreserveDay(origDate, monthsToAdd) {
        const day = origDate.getDate();
        const targetMonthTotal = origDate.getMonth() + monthsToAdd; // 0-based
        const targetYear = origDate.getFullYear() + Math.floor(targetMonthTotal / 12);
        const targetMonth = ((targetMonthTotal % 12) + 12) % 12;
        const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
        const dayToUse = Math.min(day, lastDayOfTarget);

        // The key change is to preserve the time of day from the original date
        const hours = origDate.getHours();
        const minutes = origDate.getMinutes();
        const seconds = origDate.getSeconds();
        return new Date(targetYear, targetMonth, dayToUse, hours, minutes, seconds);
    }

    const invoicePayloadsMap = new Map();
    const invoiceItemsPayloads = [];
    const periodStartEnd = [];

    for (const cfs of classFeeStructure) {
        const feeHeadId = cfs.fee_heads.id;
        const duration = cfs.fee_heads.duration;
        const amount = Number(cfs.amount);

        if (duration === 'once_per_student') {
            const periodKey = 'One-Time';
            const payPeriod = `Apr-${sessionStartYear}`

            if (!invoicePayloadsMap.has(payPeriod)) {
                invoicePayloadsMap.set(payPeriod, {
                    student_id: student.id,
                    school_id: profile.school_id,
                    session_id: currentSession.id,
                    pay_period: payPeriod,
                });
            }

            invoiceItemsPayloads.push({
                student_id: student.id,
                fee_head_id: feeHeadId,
                amount: amount,
                period_key: periodKey,
                pay_period: payPeriod,
            })
        } else if (duration === 'monthly') {
            if (student.month_fee_from === 'adm_date') {
                const admDate = new Date(student.adm_date + 'T12:00:00'); // avoid timezone issues
                
                // session end = last day of Mar of next year
                const sessionEndDate = new Date(sessionStartYear + 1, 3, 0); // Mar last day (month 3, day 0)

                // If admission is before session start, start from session start (optional / usually desired)
                let currentPeriodStart = new Date(admDate);

                while (currentPeriodStart <= sessionEndDate) {
                    const nextPeriodStart = addMonthsPreserveDay(currentPeriodStart, 1);

                    // periodEnd is the day before nextPeriodStart
                    const periodEndDate = new Date(nextPeriodStart);
                    periodEndDate.setDate(periodEndDate.getDate() - 1);

                    const periodStartStr = formatDateISO(currentPeriodStart);
                    const periodEndStr = formatDateISO(periodEndDate);

                    const monthNumber = currentPeriodStart.getMonth() + 1; // 1..12
                    // find month name from your months array (safe mapping)
                    const monthObj = months.find(m => m.number === monthNumber);
                    const monthName = monthObj.name;

                    const periodKey = monthToPeriodKey(monthName, monthNumber);
                    const payPeriod = periodKey;

                    // create invoice if not already created for this payPeriod
                    if (!invoicePayloadsMap.has(payPeriod)) {
                        invoicePayloadsMap.set(payPeriod, {
                            student_id: student.id,
                            school_id: profile.school_id,
                            session_id: currentSession.id,
                            pay_period: payPeriod,
                        });
                    }

                    // create invoice item payload
                    invoiceItemsPayloads.push({
                        student_id: student.id,
                        fee_head_id: feeHeadId,
                        amount: amount,
                        period_key: periodKey,
                        pay_period: payPeriod,
                    });

                    periodStartEnd.push({ 
                        period_start: periodStartStr, 
                        period_end: periodEndStr,
                        period_key: periodKey,
                        fee_head_id: feeHeadId,
                    });

                    // advance
                    currentPeriodStart = nextPeriodStart;
                }

            } else if (student.month_fee_from === 'session_start') {
                for (const month of months) {
                    const periodKey = monthToPeriodKey(month.name, month.number);
                    const payPeriod = periodKey;

                    // create invoice if not already created for this payPeriod
                    if (!invoicePayloadsMap.has(payPeriod)) {
                        invoicePayloadsMap.set(payPeriod, {
                            student_id: student.id,
                            school_id: profile.school_id,
                            session_id: currentSession.id,
                            pay_period: payPeriod,
                        });
                    }

                    // create invoice item payload
                    invoiceItemsPayloads.push({
                        student_id: student.id,
                        fee_head_id: feeHeadId,
                        amount: amount,
                        period_key: periodKey,
                        pay_period: payPeriod,
                    });
                }
            }
        } else if (duration === 'half_yearly') {
            for (const hy of halfYearlyKeys) {
                const periodKey = hy.periodKey;
                const payPeriod = hy.payPeriod;

                // create invoice if not already created for this payPeriod
                if (!invoicePayloadsMap.has(payPeriod)) {
                    invoicePayloadsMap.set(payPeriod, {
                        student_id: student.id,
                        school_id: profile.school_id,
                        session_id: currentSession.id,
                        pay_period: payPeriod,
                    });
                }

                // create invoice item payload
                invoiceItemsPayloads.push({
                    student_id: student.id,
                    fee_head_id: feeHeadId,
                    amount: amount,
                    period_key: periodKey,
                    pay_period: payPeriod,
                });
            }
        } else if (duration === 'yearly') {
            const periodKey = yearlyKey;
            const payPeriod = `Apr-${sessionStartYear}`;

            if (!invoicePayloadsMap.has(payPeriod)) {
                invoicePayloadsMap.set(payPeriod, {
                    student_id: student.id,
                    school_id: profile.school_id,
                    session_id: currentSession.id,
                    pay_period: payPeriod,
                });
            }

            // create invoice item payload
            invoiceItemsPayloads.push({
                student_id: student.id,
                fee_head_id: feeHeadId,
                amount: amount,
                period_key: periodKey,
                pay_period: payPeriod,
            });
        }
    }

    // Bulk create invoices
    const allInvoicePayloads = Array.from(invoicePayloadsMap.values());

    const { data: invoices, error: invInsertError } = await supabase
        .from('invoices')
        .insert(allInvoicePayloads)
        .select('id, pay_period');

    if (invInsertError) {
        return { error: 'Failed to create invoices. ' + invInsertError.message };
    }

    // Map payPeriod to invoiceId
    const invoiceIdMap  = new Map(invoices.map(inv => [inv.pay_period, inv.id]));

    // Bulk create invoice items
    const finalInvoiceItemsPayloads = invoiceItemsPayloads.map(item => {
        const invoiceId = invoiceIdMap.get(item.pay_period);
        return {
            ...item,
            invoice_id: invoiceId
        };
    });

    const { data: invItems, error: itemInsertError } = await supabase
        .from('invoice_items')
        .insert(finalInvoiceItemsPayloads)
        .select('id, period_key, fee_head_id');

    if (itemInsertError) {
        await supabase
            .from('invoice_items')
            .delete()
            .eq('student_id', student.id)
            .eq('session_id', currentSession.id);
        await supabase
            .from('invoices')
            .delete()
            .eq('student_id', student.id)
            .eq('session_id', currentSession.id);
        return { error: 'Failed to create invoice items. ' + itemInsertError.message };
    }

    // Fetch monthly invoice items where student.month_fee_from = 'adm_date'
    if (periodStartEnd.length > 0) {
        const admDateInvoiceItemsIdMap = new Map(invItems.map(ii => [`${ii.period_key}:${ii.fee_head_id}`, ii.id]));

        // Final periodStartEnd with invoice_item_id
        const finalPeriodStartEnd = periodStartEnd.map(item => {
            const invoiceItemId = admDateInvoiceItemsIdMap.get(`${item.period_key}:${item.fee_head_id}`);
            const { period_key, fee_head_id, ...rest } = item;
            return {
                ...rest,
                invoice_item_id: invoiceItemId
            }
        })
    
        const { error: pseInsertError } = await supabase
            .from('period_start_end')
            .insert(finalPeriodStartEnd);
    
        if (pseInsertError) {
            return { error: 'Error inserting period start/end: ' + pseInsertError.message };
        }
    }

    // NEW: Apply late fees for this student
    const { data: appliedLateFees, error: lateFeeError } = await supabase
        .rpc('apply_late_fees_for_student', {
            p_student_id: student.id,
            p_current_date: new Date().toISOString().split('T')[0]
        });

    if (lateFeeError) {
        console.error('Error applying late fees:', lateFeeError);
        // Don't return error - invoices were created successfully
    }
    if (appliedLateFees && appliedLateFees.length > 0) {
        console.log(`Applied ${appliedLateFees.length} late fee(s) for student ${student.id}`);
    }

    // Recompute total amounts for affected invoices
    const uniqueInvoiceIds = invoices.map(i => i.id);

    const { error } = await supabase
        .rpc('recalculate_and_update_totals_for_invoices', { p_invoice_ids: uniqueInvoiceIds });

    if (error) {
        return { error: 'Error updating invoice totals: ' + error.message };
    }
}