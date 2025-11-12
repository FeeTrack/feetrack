'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';

import Sidebar from "@/components/Sidebar";
import ConfirmModal from "@/components/ConfirmModal";
import { logoutAction } from '@/app/(auth)/logout/actions';

import {
    ChevronDown, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/Context/SessionContext";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@radix-ui/react-dialog";

const ToolHeader = ({pageName, profile}) => {
    const {currentSession, availableSessions, setCurrentSession, sessionLoading} = useSession();
    const pageTitle = pageName;

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const router = useRouter();

    const handleMobileClick = () => {
        setTimeout(() => {
            setIsSheetOpen(false);
        }, 200);
    }

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
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-x-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className='lg:hidden' onClick={() => setIsSheetOpen(true)}>
                            <Menu className="h-5 w-5"/>
                        </Button>
                    </SheetTrigger>

                    {isSheetOpen && (
                        <SheetContent slide="left" className="w-64 p-0" >
                            <VisuallyHidden>
                                <DialogTitle>Menu</DialogTitle>
                            </VisuallyHidden>
                            <Sidebar handleMobileClick={handleMobileClick} mobile={true} profile={profile} />
                        </SheetContent>
                    )}               

                </Sheet>

                {/* Page Title */}
                <h2 className="text-lg md:text-xl font-semibold capitalize">{pageTitle}</h2>
            </div>

            <div className="flex items-center gap-x-2 md:gap-x-3 lg:gap-x-4">
                {profile?.schools?.plan === 'free' ? (
                    <button className={`px-3 py-1 text-sm text-gray-800 font-medium rounded-full ${profile?.schools?.plan === 'free' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-primary hover:bg-secondary'}`} onClick={() => setShowPlanModal(true)}>Free Trial</button>
                ) : (
                    <button className={`px-3 py-1 text-sm text-white rounded-full ${profile?.schools?.plan === 'free' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-primary hover:bg-secondary'}`} onClick={() => setShowPlanModal(true)}>Pro</button>
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
                <div className="flex items-center gap-x-4">
                    {sessionLoading ? (
                        <div className="text-sm text-muted-foreground">
                            <span>Loading...</span>
                        </div>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    {currentSession ? <h2><span className="hidden md:inline">Session: </span>{currentSession.name}</h2> : 'Select Session'}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-[200px] ">
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
                        <Button variant='ghost' size='icon' className='rounded-full' >
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </Button>
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