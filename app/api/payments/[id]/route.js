import { createServerSupabase } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/supabaseQueries";
import { NextResponse } from "next/server";

export async function DELETE(req, {params}) {
    try {
        const profile = await getUser();
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 401 });

        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing Payment ID" }, { status: 400 });

        const supabase = await createServerSupabase();

        // delete_payment reverses the amounts and discounts, recalculates item and invoice
        // status, and deletes the payment, all in one transaction
        const { error } = await supabase.rpc('delete_payment', {
            p_payment_id: id,
            p_school_id: profile.school_id,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 });
    }
}
