'use server'

import { headers } from "next/headers"
import { createServerSupabase } from "@/utils/supabase/server"

// Build the reset link from the site the request came from, so it points to the live
// domain in production and to localhost in development. The env var is only a fallback.
async function getSiteOrigin() {
    const h = await headers()
    const origin = h.get('origin')
    if (origin) return origin

    const host = h.get('x-forwarded-host') || h.get('host')
    if (host) {
        const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
        return `${proto}://${host}`
    }
    return process.env.NEXT_PUBLIC_SITE_URL
}

export async function resetPasswordAction(email) {
    const supabase = await createServerSupabase()
    const origin = await getSiteOrigin()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password`
    })

    if (error) {
        console.error(error)
        return { error: error.message }
    }

    return { success: true }
}
