'use client';
import { createContext, useContext, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setSelectedSessionAction } from "@/app/user/sessionActions";

const SessionContext = createContext();

// Sessions and the selected session come from the server (app/user/layout.jsx), which reads
// the selection from a cookie. Switching sets that cookie and refreshes, so server-rendered
// pages and client components always agree on the session.
export function SessionProvider({ children, initialSessions = [], initialSession = null }) {
    const router = useRouter();
    const [currentSession, setCurrentSessionState] = useState(initialSession);
    const [switching, startTransition] = useTransition();

    // Keep in sync when the server sends a new selection (after a refresh or a fresh login)
    useEffect(() => {
        setCurrentSessionState(initialSession);
    }, [initialSession?.id]);

    const setCurrentSession = (session) => {
        if (!session || session.id === currentSession?.id) return;

        const previous = currentSession;
        setCurrentSessionState(session);
        startTransition(async () => {
            const res = await setSelectedSessionAction(session.id);
            if (res?.error) {
                setCurrentSessionState(previous);
                toast.error(res.error);
                return;
            }
            router.refresh();
        });
    }

    const value = {
        availableSessions: initialSessions,
        activeSession: initialSessions.find(s => s.is_active) || null,
        currentSession,
        setCurrentSession,
        sessionLoading: switching,
        error: initialSessions.length === 0 ? 'No academic sessions found. Please create a session.' : null,
    }

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    )
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
