import { getUser } from "@/utils/supabase/supabaseQueries";
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
    if (profile.role !== 'admin') {
        return (
            <UserLayout pageName='Staff'>
            <div className="w-full h-full flex justify-center items-center">
                <h1>Unauthorized Access.</h1>
            </div>
            </UserLayout>
        )
    }

    const {data: staff }  = await supabase
        .from('staff')
        .select('id, name, designation, mobile_no, salary')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false});
        
    return (
        <UserLayout pageName='Staff'>
            <StaffClient profile={profile} staff={staff} />
        </UserLayout>
    )
}