'use server';
import { cookies } from 'next/headers';
import { getSessions, SESSION_COOKIE } from '@/utils/session/currentSession';

export async function setSelectedSessionAction(sessionId) {
    const sessions = await getSessions();
    if (!sessions.some(s => s.id === sessionId)) {
        return { error: 'Session not found.' };
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
    });
    return { success: true };
}
