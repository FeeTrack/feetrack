'use client';

import { SessionProvider } from "@/Context/SessionContext";
import Sidebar from "@/components/Sidebar";
import ToolHeader from "@/components/ToolHeader";

export default function UserLayoutClient({ children, pageName, profile }) {
    return (
        <SessionProvider>
            <div className="flex h-screen">
                <div className="hidden lg:relative lg:inset-y-0 lg:z-10 lg:flex lg:flex-col lg:w-64 lg:overflow-y-auto">
                    <Sidebar profile={profile}/>
                </div>

                <div className="flex flex-1 flex-col">
                    <ToolHeader pageName={pageName} profile={profile} />
                    <main className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="py-6 px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
}