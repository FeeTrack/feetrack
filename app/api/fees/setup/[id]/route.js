import { createServerSupabase } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing Fee Head ID" }, { status: 400 });
    
        const supabase = await createServerSupabase();
    
        const { error } = await supabase
            .from("fee_heads")
            .delete()
            .eq("id", id);
    
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    
        return NextResponse.json({success: true}, {status: 200});
    } catch (error) {
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 });
    }
}