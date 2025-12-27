'use server'

import { createServerSupabase } from "@/utils/supabase/server"

export async function verifyCodeAction(code) {
    if (!code) {
        return { error: 'Verificaion code is required' }
    }

    const supabase = await createServerSupabase()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error('Code exchange error: ' + error)
        return { error: 'Code exchange error: ' + error.message }
    }

    return { success: true }
}

export async function updatePasswordAction(password) {
    const supabase = await createServerSupabase()

    const { error } = await supabase.auth.updateUser({
        password
    })

    if (error) {
        console.error(error)
        return { error: error.message }
    }

    return { success: true }
}