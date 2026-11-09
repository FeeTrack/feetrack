import { checkFeatureAccess, getUser } from "@/utils/supabase/supabaseQueries";
import { createServerSupabase } from '@/utils/supabase/server';

import UserLayout from "../UserLayout";
import StaffClient from "./StaffClient";
import { redirect } from "next/navigation";

export const metadata = {
    title: 'Staff | FeeTrack',
    description: 'Allows to view and manage staff.'
}

export default async function StaffPage() {
    const supabase = await createServerSupabase();

    const profile = await getUser();
    if (!profile) {
        redirect('/login')
    }
    // if (profile.role !== 'admin') {
    //     return (
    //         <UserLayout pageName='Staff'>
    //         <div className="w-full h-full flex justify-center items-center">
    //             <h1>Unauthorized Access.</h1>
    //         </div>
    //         </UserLayout>
    //     )
    // }
    
    const accessCheck = await checkFeatureAccess(profile.school_id, 'staffModule')
    if (!accessCheck.allowed) {
        return (
            <UserLayout pageName='Staff'>
            <div className="w-full h-full flex justify-center items-center">
                <h1>This feature is not available in your current plan. Kindly upgrade to access this feature.</h1>
            </div>
            </UserLayout>
        )
    }

    const {data: staff, error: staffError }  = await supabase
        .from('staff')
        .select('id, name, designation, gender, mobile_no, salary, joining_date')
        .eq('school_id', profile.school_id)
        .order('name', { ascending: true });

    if ( staffError ) {
        console.error('Error fetching staff:', staffError.message);
        return (
            <UserLayout pageName='Staff'>
                <div className="w-full h-full flex justify-center items-center">
                    <h1>Error fetching staff data. Please try again later.</h1>
                </div>
            </UserLayout>
        )
    }
        
    return (
        <UserLayout pageName='Staff'>
            <StaffClient profile={profile} staff={staff ?? []} />
        </UserLayout>
    )
}