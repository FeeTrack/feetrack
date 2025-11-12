import { getUser } from "@/utils/supabase/supabaseQueries";
import { redirect } from "next/navigation";

import UserLayout from "@/app/user/UserLayout";
import DashboardContent from './DashboardContent'

export const metadata = {
    title: 'Dashboard | FeeTrack',
    description: 'FeeTrack Dashboard'
}

export default async function DashboardPage() {  
    const profile = await getUser();
    if (!profile) {
        redirect('/login');
    }
    return (
        <UserLayout pageName='Dashboard'>
            <DashboardContent profile={profile} />
        </UserLayout>
    )
}