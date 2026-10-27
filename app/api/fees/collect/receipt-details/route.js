// app/api/fees/collect/receipt-details/route.js
// API to fetch complete payment details for receipt generation (used for reprints)

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";
import { getReceiptPayload } from "@/utils/receipt/receiptPayload";

export async function GET(req) {
    try {
        const profile = await getUser();
        if (!profile) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get('payment_id');
        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
        }

        const supabase = await createServerSupabase();
        const { payload, error } = await getReceiptPayload(supabase, paymentId, profile.school_id);
        if (error) {
            return NextResponse.json({ error }, { status: 404 });
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error('Error fetching receipt details:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
