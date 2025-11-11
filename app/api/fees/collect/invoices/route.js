import { NextResponse } from "next/server";
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('student_id');
        const sessionId = searchParams.get('session_id');
        if (!studentId) return NextResponse.json({ error: 'Missing Student ID' }, { status: 400 });
        if (!sessionId) return NextResponse.json({ error: 'Missing Session ID' }, { status: 400 });

        const supabase = await createServerSupabase();
        const profile = await getUser();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('id, pay_period, status, amount, amount_paid')
            .eq('session_id', sessionId)
            .eq('school_id', profile.school_id)
            .eq('student_id', studentId);

        if (invError ) return NextResponse.json({error: ('Inv Error: ' + invError.message)}, { status: 500 });
        if (invoices.length === 0) {
            return NextResponse.json({error: 'Fee Struture not created for the selected student. Please first create the fee structure.'}, { status: 404 });
        }

        const { data: totalDiscounts, error: tdError } = await supabase
            .from('discounts')
            .select('amount')
            .eq('session_id', sessionId)
            .eq('student_id', studentId);
        if (tdError) return NextResponse.json({ error: 'Error fetching total discounts: ' + tdError.message }, { status: 500 });

         const { data: invoiceItems, error: invItmError } = await supabase
            .from('invoice_items')
            .select('id, invoice_id, fee_heads(id, name), amount, amount_paid, status, period_key, is_late_fee, period_start_end(period_start, period_end), payment_items(discounts(amount))')
            .eq('student_id', studentId)
            .eq('status', 'pending');
        if (invItmError) return NextResponse.json({ error: invItmError.message }, { status: 500 });

        return NextResponse.json({ invoices: invoices ?? [], totalDiscounts: totalDiscounts ?? [], invoiceItems: invoiceItems ?? [] }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}