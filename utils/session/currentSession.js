import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/utils/supabase/server';

// The session the user picked in the header. Cleared on login/logout, so every
// login starts on the session marked active in Supabase.
export const SESSION_COOKIE = 'selected_session_id';

export const getSessions = cache(async () => {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from('academic_sessions')
        .select('id, name, start_date, end_date, is_active')
        .order('name', { ascending: false });

    if (error) {
        console.error('Error fetching sessions:', error.message);
        return [];
    }
    return data || [];
});

export const getActiveSession = cache(async () => {
    const sessions = await getSessions();
    return sessions.find(s => s.is_active) || sessions[0] || null;
});

// Single source of truth for "which session am I working in", for server pages and actions.
// Falls back to the active session when nothing (or an unknown id) is selected.
export const getCurrentSession = cache(async () => {
    const sessions = await getSessions();
    const cookieStore = await cookies();
    const selectedId = cookieStore.get(SESSION_COOKIE)?.value;

    return sessions.find(s => s.id === selectedId) || await getActiveSession();
});

export async function clearSelectedSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}
