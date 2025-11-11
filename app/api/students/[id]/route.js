import { createServerSupabase } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(req, {params}) {
    const supabase = await createServerSupabase();
    const { id } = await params;

    if (!id) {
        return NextResponse.json({error: "Missing Student ID"}, {status: 400});
    }

    const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({success: true}, {status: 200});
}