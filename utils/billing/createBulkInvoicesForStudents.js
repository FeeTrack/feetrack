import { createServerSupabase } from "../supabase/server";
import { getUser } from "../supabase/supabaseQueries";
import { months } from "../constants/backend";

export async function createBulkInvoicesForStudents({ students, currentSession }) {
    const supabase = await createServerSupabase();
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated.' };

    // Get unique class IDs from all students
    const classIds = [...new Set(students.map(s => s.class_id))];

    // Fetch fee structures for all classes in one query
    const { data: classFeeStructures, error: cfsError } = await supabase
        .from('fee_structures')
        .select('id, fee_heads(id, name, duration), amount, class_id')
        .eq('session_id', currentSession.id)
        .in('class_id', classIds);

    if (cfsError) {
        return { error: 'Failed to fetch fee structures.' + cfsError.message };
    }

    // Group fee structures by class_id for easy lookup
    const feeStructuresByClass = classFeeStructures.reduce((acc, cfs) => {
        if (!acc[cfs.class_id]) acc[cfs.class_id] = [];
        acc[cfs.class_id].push(cfs);
        return acc;
    }, {});

    const sessionStartYear = Number(currentSession.name.split('-')[0]);

    const monthToPeriodKey = (monthName, monthNumber) => {
        const year = (monthNumber <= 3) ? sessionStartYear + 1 : sessionStartYear;
        return `${monthName}-${year}`
    }

    const halfYearlyKeys = [
        { periodKey: `HalfYear1-${sessionStartYear}`, payPeriod: `Apr-${sessionStartYear}` },
        { periodKey: `HalfYear2-${sessionStartYear}`, payPeriod: `Oct-${sessionStartYear}` }
    ];

    const yearlyKey = `${sessionStartYear}-${sessionStartYear + 1}`;

    function formatDateISO(date) {
        return date.toISOString().slice(0, 10);
    }

    function addMonthsPreserveDay(origDate, monthsToAdd) {
        const day = origDate.getDate();
        const targetMonthTotal = origDate.getMonth() + monthsToAdd;
        const targetYear = origDate.getFullYear() + Math.floor(targetMonthTotal / 12);
        const targetMonth = ((targetMonthTotal % 12) + 12) % 12;
        const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
        const dayToUse = Math.min(day, lastDayOfTarget);
        const hours = origDate.getHours();
        const minutes = origDate.getMinutes();
        const seconds = origDate.getSeconds();
        return new Date(targetYear, targetMonth, dayToUse, hours, minutes, seconds);
    }

    // Collect ALL invoices and invoice items for ALL students
    const allInvoicePayloads = [];
    const allInvoiceItemsPayloads = [];
    const allPeriodStartEnd = [];
    const allTransportInvItemsPayloads = [];

    // Get all route IDs that students use
    const routeIds = [...new Set(students.filter(s => s.route_id).map(s => s.route_id))];
    let routesMap = new Map();
    let transFeeHeadId = null;

    if (routeIds.length > 0) {
        // Fetch all routes in one query
        const { data: routes, error: routeError } = await supabase
            .from('transport_routes')
            .select('id, monthly_fee')
            .eq('school_id', profile.school_id)
            .in('id', routeIds);

        if (routeError) {
            return { error: 'Error fetching transport routes: ' + routeError.message };
        }

        routesMap = new Map(routes.map(r => [r.id, r]));

        // Fetch transport fee head once
        const { data: transFeeHead, error: headError } = await supabase
            .from('fee_heads')
            .select('id')
            .eq('school_id', profile.school_id)
            .eq('name', 'Transport Fee')
            .single();

        if (headError) {
            return { error: 'Error fetching transport fee head: ' + headError.message };
        }
        transFeeHeadId = transFeeHead.id;
    }

    // Process each student
    for (const student of students) {
        const classFeeStructure = feeStructuresByClass[student.class_id] || [];

        if (classFeeStructure.length === 0) {
            console.warn(`No fee structures found for student ${student.name}, class ${student.class_id}`);
            continue;
        }

        const invoicePayloadsMap = new Map();
        const invoiceItemsPayloads = [];
        const periodStartEnd = [];

        // Process fee structures (same logic as before)
        for (const cfs of classFeeStructure) {
            const feeHeadId = cfs.fee_heads.id;
            const duration = cfs.fee_heads.duration;
            const amount = Number(cfs.amount);

            if (duration === 'once_per_student') {
                const periodKey = 'One-Time';
                const payPeriod = `Apr-${sessionStartYear}`;

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
                });
            } else if (duration === 'monthly') {
                if (student.month_fee_from === 'adm_date') {
                    const admDate = new Date(student.adm_date + 'T12:00:00');
                    const sessionEndDate = new Date(sessionStartYear + 1, 3, 0);
                    let currentPeriodStart = new Date(admDate);

                    while (currentPeriodStart <= sessionEndDate) {
                        const nextPeriodStart = addMonthsPreserveDay(currentPeriodStart, 1);
                        const periodEndDate = new Date(nextPeriodStart);
                        periodEndDate.setDate(periodEndDate.getDate() - 1);

                        const periodStartStr = formatDateISO(currentPeriodStart);
                        const periodEndStr = formatDateISO(periodEndDate);

                        const monthNumber = currentPeriodStart.getMonth() + 1;
                        const monthObj = months.find(m => m.number === monthNumber);
                        const monthName = monthObj.name;

                        const periodKey = monthToPeriodKey(monthName, monthNumber);
                        const payPeriod = periodKey;

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
                        });

                        periodStartEnd.push({
                            period_start: periodStartStr,
                            period_end: periodEndStr,
                            period_key: periodKey,
                            fee_head_id: feeHeadId,
                            student_id: student.id,
                        });

                        currentPeriodStart = nextPeriodStart;
                    }
                } else if (student.month_fee_from === 'session_start') {
                    for (const month of months) {
                        const periodKey = monthToPeriodKey(month.name, month.number);
                        const payPeriod = periodKey;

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
                        });
                    }
                }
            } else if (duration === 'half_yearly') {
                for (const hy of halfYearlyKeys) {
                    const periodKey = hy.periodKey;
                    const payPeriod = hy.payPeriod;

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

                invoiceItemsPayloads.push({
                    student_id: student.id,
                    fee_head_id: feeHeadId,
                    amount: amount,
                    period_key: periodKey,
                    pay_period: payPeriod,
                });
            }
        }

        // Add this student's invoices to the bulk array
        allInvoicePayloads.push(...Array.from(invoicePayloadsMap.values()));
        allInvoiceItemsPayloads.push(...invoiceItemsPayloads);
        allPeriodStartEnd.push(...periodStartEnd);

        // Handle transport fees
        if (student.route_id && transFeeHeadId) {
            const route = routesMap.get(student.route_id);
            if (route) {
                const transportInvItemsPayloads = [];

                if (student.month_fee_from === 'adm_date') {
                    const admDate = new Date(student.adm_date + 'T12:00:00');
                    const sessionEndDate = new Date(sessionStartYear + 1, 3, 0);
                    let currentPeriodStart = new Date(admDate);

                    while (currentPeriodStart <= sessionEndDate) {
                        const nextPeriodStart = addMonthsPreserveDay(currentPeriodStart, 1);
                        const monthNumber = currentPeriodStart.getMonth() + 1;
                        const monthObj = months.find(m => m.number === monthNumber);
                        const monthName = monthObj.name;
                        const periodKey = monthToPeriodKey(monthName, monthNumber);
                        const payPeriod = periodKey;

                        transportInvItemsPayloads.push({
                            student_id: student.id,
                            fee_head_id: transFeeHeadId,
                            amount: route.monthly_fee,
                            period_key: periodKey,
                            pay_period: payPeriod,
                        });

                        currentPeriodStart = nextPeriodStart;
                    }
                } else if (student.month_fee_from === 'session_start') {
                    for (const month of months) {
                        const periodKey = monthToPeriodKey(month.name, month.number);
                        const payPeriod = periodKey;

                        transportInvItemsPayloads.push({
                            student_id: student.id,
                            fee_head_id: transFeeHeadId,
                            amount: route.monthly_fee,
                            period_key: periodKey,
                            pay_period: payPeriod,
                        });
                    }
                }

                allTransportInvItemsPayloads.push(...transportInvItemsPayloads);
            }
        }
    }

    // BULK INSERT ALL INVOICES AT ONCE
    const { data: invoices, error: invInsertError } = await supabase
        .from('invoices')
        .insert(allInvoicePayloads)
        .select('id, pay_period, student_id');

    if (invInsertError) {
        return { error: 'Failed to create invoices. ' + invInsertError.message };
    }

    // Map (student_id, pay_period) to invoice_id
    const invoiceIdMap = new Map(
        invoices.map(inv => [`${inv.student_id}:${inv.pay_period}`, inv.id])
    );

    // Add invoice_id to all invoice items
    const finalInvoiceItemsPayloads = allInvoiceItemsPayloads.map(item => ({
        ...item,
        invoice_id: invoiceIdMap.get(`${item.student_id}:${item.pay_period}`)
    }));

    // BULK INSERT ALL INVOICE ITEMS AT ONCE
    const { data: invItems, error: itemInsertError } = await supabase
        .from('invoice_items')
        .insert(finalInvoiceItemsPayloads)
        .select('id, period_key, fee_head_id, student_id');

    if (itemInsertError) {
        // Cleanup on error
        await supabase.from('invoices').delete().in('id', invoices.map(i => i.id));
        return { error: 'Failed to create invoice items. ' + itemInsertError.message };
    }

    // Handle period_start_end if needed
    if (allPeriodStartEnd.length > 0) {
        const admDateInvoiceItemsIdMap = new Map(
            invItems.map(ii => [`${ii.student_id}:${ii.period_key}:${ii.fee_head_id}`, ii.id])
        );

        const finalPeriodStartEnd = allPeriodStartEnd.map(item => {
            const invoiceItemId = admDateInvoiceItemsIdMap.get(
                `${item.student_id}:${item.period_key}:${item.fee_head_id}`
            );
            const { period_key, fee_head_id, student_id, ...rest } = item;
            return {
                ...rest,
                invoice_item_id: invoiceItemId
            };
        });

        const { error: pseInsertError } = await supabase
            .from('period_start_end')
            .insert(finalPeriodStartEnd);

        if (pseInsertError) {
            return { error: 'Error inserting period start/end: ' + pseInsertError.message };
        }
    }

    // BULK INSERT TRANSPORT INVOICE ITEMS
    if (allTransportInvItemsPayloads.length > 0) {
        const finalTransInvItemsPayloads = allTransportInvItemsPayloads.map(item => ({
            ...item,
            invoice_id: invoiceIdMap.get(`${item.student_id}:${item.pay_period}`)
        }));

        const { error: transInvItemInsertErr } = await supabase
            .from('invoice_items')
            .insert(finalTransInvItemsPayloads);

        if (transInvItemInsertErr) {
            return { error: 'Error inserting transport invoice items: ' + transInvItemInsertErr.message };
        }
    }

    // Apply late fees for all students in one RPC call (if your function supports it)
    // Or loop through students with their IDs
    for (const student of students) {
        await supabase.rpc('apply_late_fees_for_student', {
            p_student_id: student.id,
            p_current_date: new Date().toISOString().split('T')[0]
        });
    }

    // Recalculate totals for all invoices
    const uniqueInvoiceIds = invoices.map(i => i.id);
    const { error } = await supabase
        .rpc('recalculate_and_update_totals_for_invoices', { p_invoice_ids: uniqueInvoiceIds });

    if (error) {
        return { error: 'Error updating invoice totals: ' + error.message };
    }

    return { success: true };
}