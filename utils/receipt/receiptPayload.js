// Everything needed to render a receipt. Shared by the receipt-details API (reprints)
// and the payment API (which returns it right away, saving a round trip).
// Amounts are as of this payment: "prev_paid" only counts payments made before it,
// so a reprint months later shows the same figures as the original.
export async function getReceiptPayload(supabase, paymentId, schoolId) {
    const { data: payment, error } = await supabase
        .from('payments')
        .select(`
            id,
            schools (name, address),
            receipt_no,
            created_at,
            method,
            transaction_id,
            students (
                name, adm_no, roll_no, father_name, mother_name, parent_mobile,
                classes (name),
                sections (name)
            ),
            payment_items (
                amount,
                invoice_item_id,
                invoice_items (
                    amount, period_key, pay_period, is_late_fee,
                    fee_heads (name),
                    period_start_end (period_start, period_end)
                ),
                discounts (amount, description)
            )
        `)
        .eq('id', paymentId)
        .eq('school_id', schoolId)
        .single();

    if (error || !payment) {
        return { error: 'Payment not found' + (error ? ': ' + error.message : '') };
    }

    const itemIds = (payment.payment_items || []).map(pi => pi.invoice_item_id);

    // Earlier payments (and their discounts) against the same fee items
    const { data: otherPaymentItems, error: prevError } = itemIds.length
        ? await supabase
            .from('payment_items')
            .select('invoice_item_id, amount, payments!inner(id, created_at), discounts(amount)')
            .in('invoice_item_id', itemIds)
            .neq('payment_id', paymentId)
        : { data: [] };
    if (prevError) {
        return { error: 'Failed to load previous payments: ' + prevError.message };
    }

    const thisTime = new Date(payment.created_at).getTime();
    const prevPaidByItem = new Map();
    for (const pi of otherPaymentItems || []) {
        if (new Date(pi.payments.created_at).getTime() >= thisTime) continue;
        const prev = prevPaidByItem.get(pi.invoice_item_id) || 0;
        prevPaidByItem.set(pi.invoice_item_id, prev + Number(pi.amount) + Number(pi.discounts?.amount || 0));
    }

    const items = (payment.payment_items || []).map(pi => {
        const invoiceItem = pi.invoice_items;
        return {
            fee_head_name: invoiceItem.fee_heads.name,
            is_late_fee: invoiceItem.is_late_fee,
            pay_period: invoiceItem.pay_period,
            period_key: invoiceItem.period_key,
            period_start: invoiceItem.period_start_end?.[0]?.period_start || null,
            period_end: invoiceItem.period_start_end?.[0]?.period_end || null,
            amount: Number(invoiceItem.amount),
            prev_paid: prevPaidByItem.get(pi.invoice_item_id) || 0,
            discount: Number(pi.discounts?.amount || 0),
            amount_paid: Number(pi.amount),
        };
    });

    return {
        payload: {
            school: {
                name: payment.schools?.name || 'School Name',
                address: payment.schools?.address || '',
                logo: null,
            },
            payment: {
                receipt_no: payment.receipt_no,
                created_at: payment.created_at,
                method: payment.method,
                transaction_id: payment.transaction_id,
                discount_description: payment.payment_items?.flatMap(pi => pi.discounts || [])?.find(d => d.description)?.description || null,
            },
            student: {
                name: payment.students?.name,
                adm_no: payment.students?.adm_no,
                roll_no: payment.students?.roll_no,
                father_name: payment.students?.father_name,
                mother_name: payment.students?.mother_name,
                mobile_no: payment.students?.parent_mobile,
                class_name: payment.students?.classes?.name,
                section_name: payment.students?.sections?.name,
            },
            items,
        }
    };
}
