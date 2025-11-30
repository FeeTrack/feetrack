'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';

import Sidebar from "@/components/Sidebar";
import ConfirmModal from "@/components/ConfirmModal";
import { logoutAction } from '@/app/(auth)/logout/actions';

import { ChevronDown, Menu, X } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/Context/SessionContext";

const ToolHeader = ({pageName, profile}) => {
    const {currentSession, availableSessions, setCurrentSession, sessionLoading} = useSession();
    const pageTitle = pageName;

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        try {
          // Call the server action — this runs on the server and clears cookies
          const result = await logoutAction();
          if (result?.success) {
            // client-side navigation after server sign-out
            router.push('/login');
          } else {
            // fallback behavior
            console.error('Sign-out returned unexpected result', result);
          }
        } catch (err) {
          console.error('Sign-out failed', err);
        }
    };

    return (
        <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-x-2 border-b border-gray-300 bg-white px-2 shadow-sm xs:px-4 lg:px-8 z-10 ">
            <div className="flex items-center gap-x-2 xs:gap-x-4">
                <button type="button" className='lg:hidden' onClick={() => setIsSheetOpen(true)}>
                    <Menu className="h-5 w-5"/>
                </button>
                <div className={`${isSheetOpen ? 'translate-x-0' : '-translate-x-64'} fixed top-0 left-0 h-screen overflow-y-auto w-64 bg-primary text-white transition-transform duration-300 ease-in-out`}>
                    <button type="button" className="absolute top-4 right-4 w-5 h-5 text-white" onClick={() => setIsSheetOpen(false)}>
                        <X aria-label="Mobile Navbar Close Button"/>
                    </button>

                    <Sidebar handleMobileClick={() => setIsSheetOpen(false)} mobile={true} profile={profile} />
                </div>

                {/* Page Title */}
                <h2 className="md:text-xl font-semibold capitalize max-w-min">{pageTitle}</h2>
            </div>
            

            <div className="flex items-center gap-x-2 sm:gap-x-4">
                {profile?.schools?.plan === 'free' ? (
                    <button className={`px-2 py-1 text-xs sm:text-sm text-gray-800 font-medium rounded-full ${profile?.schools?.plan === 'free' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-primary hover:bg-secondary'}`} onClick={() => setShowPlanModal(true)}>Free Trial</button>
                ) : (
                    <button className={`px-2 py-1 text-xs sm:text-sm text-white rounded-full ${profile?.schools?.plan === 'free' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-primary hover:bg-secondary'}`} onClick={() => setShowPlanModal(true)}>Pro</button>
                )}
                
                {showPlanModal && (
                    <ConfirmModal
                        isOpen={showPlanModal}
                        onClose={() => setShowPlanModal(false)}
                        onConfirm={() => router.push('/contact')}
                        title="Plan Details"
                        buttonAction="Contact Sales"
                        message={
                        <>You're currently using the {profile?.schools?.plan === 'free' ? '7-day free trial' : 'Pro'} plan. If you wish to upgrade or have any query, please contact sales.</>
                        }
                    />
                )}

                {/* Session Selector */}
                <div className="flex items-center">
                    {sessionLoading ? (
                        <div className="text-xs text-muted-foreground">
                            <span>Loading...</span>
                        </div>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center text-xs sm:text-sm py-1 px-1 xs:px-2 rounded-lg border hover:border-primary gap-1">
                                    {currentSession ? <h2><span className="hidden md:inline">Session: </span>{currentSession.name}</h2> : 'Select Session'}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Select Session</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {availableSessions.map(session => (
                                    <DropdownMenuItem key={session.id} onClick={() => setCurrentSession(session)} className={currentSession?.id === session.id ? 'bg-primary/10' : ''}>
                                        {session.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className='rounded-full size-6 xs:size-9 bg-transparent hover:bg-secondary flex items-center justify-center'>
                            <div className="rounded-full size-5 xs:size-8 text-xs xs:text-sm bg-primary text-primary-foreground flex justify-center items-center">
                                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="text-destructive p-0">
                            <button className="w-full rounded-md text-start p-1 hover:bg-red-400 hover:text-white transition-all duration-200" onClick={handleSignOut}>
                                Logout
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

        </header>
    )
}

export default ToolHeader;