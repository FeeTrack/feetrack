// app/api/payments/update/route.js
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";

export async function POST(req) {
    try {
        const profile = await getUser();
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 401 });

        const body = await req.json();
        const { paymentId, rawAllocations, discountDescription, method, transactionId } = body;
        if (!paymentId) return NextResponse.json({ error: 'Missing Payment ID' }, { status: 400 });
        if (!rawAllocations) return NextResponse.json({ error: 'Missing Allocations' }, { status: 400 });

        let allocations = [];
        try {
            allocations = typeof rawAllocations === 'string' ? JSON.parse(rawAllocations) : rawAllocations;
            if (!Array.isArray(allocations) || allocations.length === 0) {
                return NextResponse.json({ error: "No allocations provided." }, { status: 400 });
            }
        } catch (error) {
            return NextResponse.json({ error: "Invalid Allocations Format: " + error.message }, { status: 400 });
        }

        const supabase = await createServerSupabase();

        // update_payment undoes the payment's old allocations and applies the new ones in one
        // transaction, keeping the same payment row and receipt number
        const { error } = await supabase.rpc('update_payment', {
            p_payment_id: paymentId,
            p_school_id: profile.school_id,
            p_allocations: allocations.map(a => ({
                invoice_item_id: a.invoice_item_id,
                receiving: Number(a.receiving) || 0,
                discount: Number(a.discountAmount) || 0,
            })),
            p_method: method || null,
            p_transaction_id: transactionId || null,
            p_discount_description: discountDescription || null,
        });

        if (error) {
            return NextResponse.json({ error: 'Error updating payment: ' + error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, paymentId });
    } catch (error) {
        return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
    }
}
