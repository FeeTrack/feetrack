'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

import { getUser } from "@/utils/supabase/supabaseQueries";
import { logoutAction } from "@/app/(auth)/logout/actions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

import { Menu, X } from "lucide-react";

export default function NormalHeader() {
    const [toggle, setToggle] = useState(false);
    const [profile, setProfile] = useState(null)

    useEffect(() => {
        const fetchProfile = async () => {
            const fetchedProfile = await getUser();
            if (fetchedProfile) {
                setProfile(fetchedProfile)
            }
            return
        }
        fetchProfile();
    }, [])
    
    // const activeNavLink = window.location.pathname
    useEffect(() => {
        const handleScroll = () => {
            let top = window.scrollY;
            if (top > 60) {
                document.querySelector('header')?.classList.add('headerScroll')
            } else {
                document.querySelector('header')?.classList.remove('headerScroll')
            }
        }

        window.addEventListener('scroll', handleScroll)

        return () => removeEventListener('scroll', handleScroll)
    })

    const navs = [
        { name: 'Features', href: '/#features' },
        // { name: 'Pricing', href: '/pricing' },
        { name: 'Contact', href: '/contact' }
    ]


    const handleSignOut = async () => {
        try {
            // Call the server action — this runs on the server and clears cookies
            const result = await logoutAction();
            if (result?.success) {
            // client-side navigation after server sign-out
            setProfile(null)
            } else {
            // fallback behavior
            console.error('Sign-out returned unexpected result', result);
            }
        } catch (err) {
            console.error('Sign-out failed', err);
        }
    };

    return (
        <header className={`w-full max-w-7xl sticky top-0 z-10 h-14 flex items-center justify-between bg-white px-6 py-3 transition-all duration-300 ease-in-out border-gray-300 ${toggle ? 'border-b ' : 'border-b-0'}`}>
            <Link href='/' className="flex items-center gap-x-2">
                <h1 className="text-lg font-bold text-gray-900 italic">FeeTrack</h1>                
            </Link>

            <div className="hidden md:flex items-center gap-x-8">
                {navs.map(nav => (
                    <Link key={nav.name} href={nav.href} className="text-gray-900 text-sm font-semibold">
                        {nav.name}
                    </Link>
                ))}
            </div>

            <div className="hidden md:flex items-center gap-x-4">
                {profile ? (
                    <>
                        <Link href='/user/dashboard' className="text-gray-900 text-sm font-semibold">
                            Dashboard
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='rounded-full' >
                                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                        {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-destructive p-0">
                                    <button className="w-full rounded-md text-start p-1 hover:bg-red-400 hover:text-white transition-all duration-200" onClick={handleSignOut}>
                                        Logout
                                    </button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <>
                        <Link href='/login' className="text-gray-900 text-sm font-semibold">
                            Sign in
                        </Link>

                        <Link href='/signup' className="primary-btn text-sm font-semibold">
                            Try for Free
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden">
                <div className="flex items-center gap-4">
                    <Link href='/signup' className="primary-btn text-sm font-semibold">
                        Try for Free
                    </Link>

                    <button onClick={() => setToggle(prev => !prev)} className="w-6 h-6 text-black  transition-all duration-300" aria-label="Mobile Navbar Toggle">
                        {toggle ? <X aria-label="Mobile Navbar Close"/> : <Menu aria-label="Mobile Navbar Open" />}
                    </button>
                </div>

                <div className={`${toggle ? 'translate-x-0' : 'translate-x-full'} flex flex-col fixed top-14 left-0 w-full bg-white text-black min-h-[calc(100vh-56px)] items-center z-50 transition-transform duration-300 ease-in-out`}>
                    <div className="w-full flex flex-col items-center">
                        <div className="w-full flex flex-col items-start gap-4 mt-4 py-3 px-6">
                            {navs.map(nav => (
                                <Link key={nav.name} href={nav.href} className="text-gray-900 text-lg w-full font-semibold rounded-lg p-1 hover:bg-gray-200 transition-all duration-200">
                                    {nav.name}
                                </Link>
                            ))}
                        </div>

                        <div className="w-full flex flex-col gap-4 mt-8 py-3 px-6">
                            {profile ? (
                                <div className="w-full">
                                    <Link href='/user/dashboard' className="w-full flex justify-center primary-btn text-base py-2 rounded-full bg-primary text-white hover:bg-secondary border border-gray-300 shadow-sm" >
                                        Dashboard
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="w-full">
                                        <Link href='/login' className="w-full flex justify-center primary-btn text-base py-2 rounded-full bg-white text-black hover:bg-gray-100 border border-gray-300 shadow-sm" >
                                            Sign in
                                        </Link>
                                    </div>

                                    <div className="w-full">
                                        <Link href='/signup' className="w-full flex justify-center primary-btn text-base py-2 rounded-full bg-primary text-white hover:bg-secondary border border-gray-300 shadow-sm" >
                                            Try for Free
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}