import { NextResponse } from "next/server";
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('student_id');
        const sessionId = searchParams.get('session_id');
        const paymentId = searchParams.get('payment_id');
        if (!studentId) return NextResponse.json({ error: 'Missing Student ID' }, { status: 400 });
        if (!sessionId) return NextResponse.json({ error: 'Missing Session ID' }, { status: 400 });
        if (!paymentId) return NextResponse.json({ error: 'Missing Payment ID' }, { status: 400 });

        const [supabase, profile] = await Promise.all([createServerSupabase(), getUser()]);
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Independent lookups, run together
        const [
            { data: invoices, error: invError },
            { data: totalDiscounts, error: tdError },
            { data: invoiceItems, error: invItmError },
            { data: payItems, error: piError },
        ] = await Promise.all([
            supabase
                .from('invoices')
                .select('id, pay_period, status, amount, amount_paid')
                .eq('session_id', sessionId)
                .eq('school_id', profile.school_id)
                .eq('student_id', studentId),
            supabase
                .from('discounts')
                .select('amount')
                .eq('session_id', sessionId)
                .eq('student_id', studentId),
            supabase
                .from('invoice_items')
                .select('id, invoice_id, fee_heads(id, name), amount, amount_paid, status, period_key, is_late_fee, period_start_end(period_start, period_end), payment_items(discounts(amount)), invoices!inner(session_id)')
                .eq('student_id', studentId)
                .eq('invoices.session_id', sessionId),
            supabase
                .from('payment_items')
                .select('invoice_items(id, invoices(id)), amount, discounts(amount, description)')
                .eq('payment_id', paymentId),
        ]);

        if (invError || !invoices) return NextResponse.json({ error: 'Inv Error: ' + (invError?.message || 'No invoices found.') }, { status: 500 });
        if (tdError) return NextResponse.json({ error: 'Error fetching total discounts: ' + tdError.message }, { status: 500 });
        if (invItmError) return NextResponse.json({ error: invItmError.message }, { status: 500 });
        if (piError) return NextResponse.json({ error: 'Failed to fetch previous pay periods: ' + piError.message }, { status: 500 });

        return NextResponse.json({ invoices: invoices ?? [], totalDiscounts: totalDiscounts ?? [], invoiceItems: invoiceItems ?? [], paymentItems: payItems ?? [] }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
