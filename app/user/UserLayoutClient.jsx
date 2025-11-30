'use client';

import { SessionProvider } from "@/Context/SessionContext";
import Sidebar from "@/components/Sidebar";
import ToolHeader from "@/components/ToolHeader";

export default function UserLayoutClient({ children, pageName, profile }) {
    return (
        <SessionProvider>
            <div className="flex min-h-screen">
                <div className="hidden lg:block fixed top-0 left-0 h-screen w-64 xl:w-[320px] bg-primary">
                    <Sidebar profile={profile} />
                </div>

                <div className="flex flex-1 flex-col lg:ml-64 xl:ml-[320px]">
                    <ToolHeader pageName={pageName} profile={profile} />
                    <main className="flex-1 bg-gray-50 h-full overflow-y-auto">
                        <div className="py-6 px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
}