import { createServerSupabase } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

// POST /api/students
export async function POST(request) {
  const supabase = await createServerSupabase();
  const body = await request.json();

  const { name, class_id, section_id, adm_no, roll_no, parent_mobile, school_id } = body;

  if (!name || !class_id || !section_id || !adm_no) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("students")
    .insert([
      {
        name,
        class_id,
        section_id,
        adm_no,
        roll_no,
        parent_mobile,
        school_id, // make sure you pass the correct school_id
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error inserting student:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, student: data });
}
