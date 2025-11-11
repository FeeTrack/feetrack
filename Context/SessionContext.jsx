'use client';
import { createContext, useContext, useState, useEffect } from "react";
import { createClientSupabase } from "@/utils/supabase/client";

const SessionContext = createContext();

export function SessionProvider({children}) {
    const [availableSessions, setAvailableSessions] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem('available_sessions');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [currentSession, setCurrentSessionState] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (availableSessions.length === 0) {
            fetchSessions();
        } else {
            // If we have cached sessions, restore the current session
            const storedSessionId = sessionStorage.getItem('selected_session_id');
            if (storedSessionId) {
                const session = availableSessions.find(s => s.id === storedSessionId);
                if (session) {
                    setCurrentSessionState(session);
                }
            } else {
                const activeSession = availableSessions.find(s => s.is_active);
                if (activeSession) {
                    setCurrentSessionState(activeSession);
                }
            }
        }
    }, []);

    const fetchSessions = async () => {
        try {
            setSessionLoading(true);
            setError(null);

            const supabase = createClientSupabase();

            const { data: sessionsData, error } = await supabase
                .from('academic_sessions')
                .select('id, name, start_date, end_date, is_active')
                .order('name', { ascending: false });

            if (error) throw error;

            if (!sessionsData || sessionsData.length === 0) {
                throw new Error('No academic sessions found. Please create a session.')
            }

            setAvailableSessions(sessionsData);
            // Cache sessions in sessionStorage
            sessionStorage.setItem('available_sessions', JSON.stringify(sessionsData));

            const storedSessionId = sessionStorage.getItem('selected_session_id')

            let selectedSession = null;
            if (storedSessionId) {
                selectedSession = sessionsData.find(s => s.id === storedSessionId);
            } else {
                selectedSession = sessionsData.find(s => s.is_active);
            }

            setCurrentSessionState(selectedSession);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setError(error.message);
        } finally {
            setSessionLoading(false);
        }
    }

    const setCurrentSession = (session) => {
        setCurrentSessionState(session);
        sessionStorage.setItem('selected_session_id', session.id);
    }

    const value = {
        availableSessions,
        currentSession,
        setCurrentSession,
        sessionLoading,
        error,
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