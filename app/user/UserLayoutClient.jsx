'use client';

import { AlertTriangle } from "lucide-react";
import { useSession } from "@/Context/SessionContext";
import Sidebar from "@/components/Sidebar";
import ToolHeader from "@/components/ToolHeader";

function PastSessionBanner() {
    const { currentSession, activeSession, setCurrentSession, sessionLoading } = useSession();
    if (!currentSession || !activeSession || currentSession.id === activeSession.id) return null;

    return (
        <div className="print:hidden flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 lg:px-8">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p>
                You are viewing session <span className="font-bold">{currentSession.name}</span>. The active session is <span className="font-bold">{activeSession.name}</span>.
            </p>
            <button
                onClick={() => setCurrentSession(activeSession)}
                disabled={sessionLoading}
                className="font-semibold underline hover:text-amber-700 cursor-pointer disabled:opacity-60"
            >
                Switch to {activeSession.name}
            </button>
        </div>
    );
}

export default function UserLayoutClient({ children, pageName, profile }) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden lg:block print:hidden fixed top-0 left-0 h-screen w-64 xl:w-[320px] bg-primary">
                <Sidebar profile={profile} />
            </div>

            <div className="flex flex-1 flex-col min-h-screen lg:ml-64 xl:ml-[320px] print:ml-0">
                <ToolHeader pageName={pageName} profile={profile} />
                <PastSessionBanner />
                <main className="flex-1 bg-gray-50 overflow-y-auto print:bg-white print:overflow-visible">
                    <div className="py-6 px-4 sm:px-6 lg:px-8 print:p-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
