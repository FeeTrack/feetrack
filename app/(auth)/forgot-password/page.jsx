import { getUser } from "@/utils/supabase/supabaseQueries";
import { redirect } from "next/navigation";

export default function UpdatePassword() {
    const profile = getUser();
    if (!profile) {
        redirect('/login')
    }

    return 
}