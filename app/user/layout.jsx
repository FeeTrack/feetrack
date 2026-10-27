import { SessionProvider } from "@/Context/SessionContext";
import { getSessions, getCurrentSession } from "@/utils/session/currentSession";

// Wraps every /user page once, so the session state survives navigation between pages
export default async function UserRootLayout({ children }) {
    const [sessions, currentSession] = await Promise.all([getSessions(), getCurrentSession()]);

    return (
        <SessionProvider initialSessions={sessions} initialSession={currentSession}>
            {children}
        </SessionProvider>
    );
}
