import { createServerSupabase } from "@/utils/supabase/server"
import { getUser } from "@/utils/supabase/supabaseQueries"
import { redirect } from "next/navigation"

import UserLayout from "../../UserLayout"
import MigrationClient from "./MigrationClient"

export const metadata = {
    title: 'Student Migration | FeeTrack',
    description: "The page to change students' class and section with changing academic years."
}

export default async function MigrationPage() {
    const profile = await getUser()
    if (!profile) {
        redirect('/login')
    }

    const supabase = await createServerSupabase()

    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id);

    const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id')
        .eq('school_id', profile.school_id);    
    
    return (
        <UserLayout pageName='Student Migration'>
            <MigrationClient profile={profile} classes={classes} sections={sections} />
        </UserLayout>
    )
}