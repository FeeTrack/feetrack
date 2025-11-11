'use server'
import { createServerSupabase } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export async function signupAction(prevState, formData) {
    const schoolName = String(formData.get('schoolName') ?? '')
    const schoolAddress = String(formData.get('schoolAddress') ?? '')
    const schoolType = String(formData.get('schoolType') ?? '')
    const userName = String(formData.get('profileName') ?? '')
    const mobileNumber = String(formData.get('mobileNumber') ?? '')
    const email = String(formData.get('emailUserName') ?? '')
    const password = String(formData.get('password') ?? '')

    const supabase = await createServerSupabase()

    // sign up with email + password, supabase will set secure cookies via the server client
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })

    const user = data.user;

    if (error) {
        console.error("Signup error:", error)
        if (error.code === 'user_already_exists') {
            return { error: "An account with this email already exists. Please login." }
        }
        return { error: "Failed to create account. Please try again." }
    }

    const today = new Date();
    today.setDate(today.getDate() + 6);
    today.setHours(23,59,59,999);

    const valid_till = today.toISOString().split('T')[0];

    const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert([
            { name: schoolName, address: schoolAddress, type: schoolType, created_by: user.id, valid_till }
        ])
        .select()
        .single();

    if (schoolError) {
        console.error("School insertion error:", schoolError)
        return { error: "Failed to create school. Please try again." }
    }

    // Store additional user information in the database
    const { error: dbError } = await supabase
        .from('profiles')
        .insert([
            { id: user.id, name: userName, mobile_no: mobileNumber, school_id: school.id }
        ]);

    if (dbError) {
        console.error("Database error:", dbError)
        await supabase.from('schools').delete().eq('created_by', user.id)
        return { error: "Failed to create profile. Please try again." }
    }    

    // Redirect the user after successful signup
    if (data.session) {
        redirect('/user/dashboard')
    } else {
        redirect('/login')
    }
}