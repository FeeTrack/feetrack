import { createServerSupabase } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(req, {params}) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing Payment ID" }, { status: 400 });
    
        const supabase = await createServerSupabase();

        const { data: payItems, error: piError } = await supabase
            .from('payment_items')
            .select('invoice_items(id, amount_paid, invoices(id, amount_paid)), amount')
            .eq('payment_id', id);

        if (piError) {
            toast.error('Failed to fetch invoice items or invoices: ' + piError.message);
            return;
        }

        const invoiceItemUpdates = [];
        for (const p of payItems) {
            invoiceItemUpdates.push({
                id: p.invoice_items.id,
                amount_paid: Math.max(0, p.invoice_items.amount_paid - p.amount),
                status: 'pending' // Reset status to pending; further logic can be added if needed
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
        if (errors.length > 0) {
            return NextResponse.json({ error: "Error updating invoice items: " + errors.map(e => e.error).join(', ') }, { status: 500 });
        }

        const invoiceIds = [...new Set(payItems.map(p => p.invoice_items.invoices.id))];

        const { error: invTotalError } = await supabase
            .rpc('recalculate_and_update_invoice_payments', { p_invoice_ids: invoiceIds });

        if (invTotalError) {
            return NextResponse.json({ error: 'Error updating invoice totals: ' + invTotalError.message }, { status: 500 });
        }

        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', id);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 });
    }
}