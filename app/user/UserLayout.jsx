'use server';

import { getUser } from "@/utils/supabase/supabaseQueries";
import { redirect } from "next/navigation";
import UserLayoutClient from "./UserLayoutClient";

export default async function UserLayout({children, pageName}) {
    const profile = await getUser();

    if (!profile) {
        redirect('/login');
    }
    
    return (
        <UserLayoutClient pageName={pageName} profile={profile}>
            {children}
        </UserLayoutClient>
    )
}