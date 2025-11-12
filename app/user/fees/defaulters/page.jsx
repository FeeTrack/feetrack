import { getUser } from "@/utils/supabase/supabaseQueries";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";

import DefaultersClient from "./DefaultersClient";
import UserLayout from "../../UserLayout";

export const metadata = {
    title: 'View Defaulters | FeeTrack',
    description: 'The page to find students whose fees are due.'
}

export default async function DefaultersPage() {
    const profile = await getUser();
    if (!profile) {
        redirect('/login');
    }

    const supabase = await createServerSupabase();
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .order('name', { ascending: true })
        .eq('school_id', profile.school_id);

    const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id')
        .order('name', { ascending: true })
        .eq('school_id', profile.school_id);

    return (
        <UserLayout pageName='Fee Defaulters'>
            <DefaultersClient
                classes={classes || []}
                sections={sections || []}
            />
        </UserLayout>
    );
}