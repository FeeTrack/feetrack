// app/api/fees/collect/payment/route.js
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";
import { getReceiptPayload } from "@/utils/receipt/receiptPayload";

export async function POST(req) {
    try {
        const profile = await getUser();
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 401 });

        const body = await req.json();
        const { studentId, sessionId, rawAllocations, discountDescription, method, transactionId } = body;
        if (!studentId) return NextResponse.json({ error: 'Missing Student ID' }, { status: 400 });
        if (!sessionId) return NextResponse.json({ error: 'Missing Session Info' }, { status: 400 });
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

        // record_payment does everything in one transaction: receipt number, payment, payment items,
        // discounts, invoice item and invoice totals. Balances are checked against the database,
        // not the amounts the browser sent, and any failure rolls the whole payment back.
        const { data: paymentId, error } = await supabase.rpc('record_payment', {
            p_school_id: profile.school_id,
            p_student_id: studentId,
            p_session_id: sessionId,
            p_allocations: allocations.map(a => ({
                invoice_item_id: a.invoice_item_id,
                receiving: Number(a.receiving) || 0,
                discount: Number(a.discountAmount) || 0,
            })),
            p_method: method || null,
            p_transaction_id: transactionId || null,
            p_discount_description: discountDescription || null,
        });

        if (error || !paymentId) {
            return NextResponse.json({ error: 'Error recording payment: ' + (error?.message ?? '') }, { status: 400 });
        }

        // Send the receipt back with the payment so the client can print without another request
        const { payload: receipt } = await getReceiptPayload(supabase, paymentId, profile.school_id);

        return NextResponse.json({ success: true, paymentId, receipt: receipt || null });
    } catch (error) {
        return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
    }
}
