// app/api/fees/collect/payment/route.js
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";

export async function POST(req) {
    try {
        const profile = await getUser();
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 401 });

        const body = await req.json();
        const { paymentId, studentId, sessionId, rawAllocations, allocSum, discountDescription, method, transactionId } = body;
        if (!paymentId) return NextResponse.json({ error: 'Missing Payment ID' }, { status: 400 });
        if (!studentId) return NextResponse.json({ error: 'Missing Student ID' }, { status: 400 });
        if (!rawAllocations) return NextResponse.json({ error: 'Missing Allocations' }, { status: 400 });

        let allocations = [];
        try {
            // Check if it's already an array or a string
            allocations = typeof rawAllocations === 'string' 
                ? JSON.parse(rawAllocations) 
                : rawAllocations;
                
            if (!Array.isArray(allocations) || allocations.length === 0) {
                return NextResponse.json({ error: "No allocations provided." }, { status: 400 });
            }
        } catch (error) {
            console.error('Parse error:', error); // Add logging
            return NextResponse.json({ error: "Invalid Allocations Format: " + error.message }, { status: 400 });
        }
        
        const supabase = await createServerSupabase();
        // Record the payment
        const { error: payErr } = await supabase
            .from('payments')
            .update({
                amount: allocSum,
                method: method || null,
                transaction_id: transactionId || null
            })
            .eq('id', paymentId)
        if (payErr) return NextResponse.json({ error: "Error recording payment: " + payErr?.message }, { status: 500 });

        // Apply allocations
        try {
            const paRows = allocations.map(a => ({
                payment_id: paymentId,
                invoice_item_id: a.invoice_item_id,
                amount: Number(a.receiving)
            }))

            const { data: piRows,error: paError } = await supabase
                .from('payment_items')
                .upsert(paRows, { onConflict: ['payment_id', 'invoice_item_id'], returning: 'representation'})
                .select();
            if (paError) {
                return NextResponse.json({ error: "Error updating allocations: " + paError.message }, { status: 500 });
            }
            if (!piRows || piRows.length === 0) {
                return NextResponse.json({ error: "No payment items returned" }, { status: 500 });
            }

            // Record discounts if any
            const discountAllocations = allocations.filter(a => a.discountAmount);
            
            const discountItemIds = discountAllocations.map(da => da.invoice_item_id);

            const discountPiRows = piRows.filter(pi => discountItemIds.includes(pi.invoice_item_id));

            if (discountPiRows.length > 0) {
                const discountRows = [];

                discountPiRows.forEach(dpi => {
                    const discount = discountAllocations.find(da => da.invoice_item_id === dpi.invoice_item_id);
                    discountRows.push({
                        student_id: studentId,
                        payment_item_id: dpi.id,
                        session_id: sessionId,
                        amount: Number(discount.discountAmount),
                        description: discountDescription || null
                    });                    
                });

                const { error: discInsertError } = await supabase
                    .from('discounts')
                    .upsert(discountRows, {onConflict: 'payment_item_id', returning: 'minimal'});
                if (discInsertError) {
                    return NextResponse.json({ error: "Error updating discount details: " + discInsertError.message }, { status: 500 });
                }
            }

            // update each invoice_item.amount_paid and status
            const invoiceItemUpdates = [];
            for (const a of allocations) {
                invoiceItemUpdates.push({
                    id: a.invoice_item_id,
                    amount_paid: Number(a.amount_paid) + Number(a.receiving),
                    status: (Number(a.amount_paid) + Number(a.prev_discounts) + Number(a.receiving) + Number(a.discountAmount) >= Number(a.amount)) ? 'paid' : 'pending'
                });
            }
            const itemUpdates = invoiceItemUpdates.map(ii => (
                supabase
                    .from('invoice_items')
                    .update({ amount_paid: ii.amount_paid, status: ii.status })
                    .eq('id', ii.id)
            ))
            const results = await Promise.all(itemUpdates);

            const errors = results.filter(r => r.error);
            if (errors.length) {
                return NextResponse.json({ error: "Error updating invoice items: " + errors.map(e => e.error.message).join(', ') }, { status: 500 });
            }

            // update invoice totals and status
            const invoiceIds = [...new Set(allocations.map(a => a.invoice_id))];

            const { error: invTotalError } = await supabase
                .rpc('recalculate_and_update_invoice_payments', { p_invoice_ids: invoiceIds });

            if (invTotalError) {
                return NextResponse.json({ error: 'Error updating invoice totals: ' + invTotalError.message }, { status: 500 });
            }

        } catch (error) {
            return NextResponse.json({ error: 'Error applying allocations: ' + error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, paymentId: paymentId });
    } catch (error) {
        return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
    }
}