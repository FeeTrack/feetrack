'use server'

import { createServerSupabase } from "@/utils/supabase/server"

export async function resetPasswordAction(email) {
    const supabase = await createServerSupabase()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`
    })

    if (error) {
        console.error(error)
        return { error: error.message }
    }

    return { success: true }
}