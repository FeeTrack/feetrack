import { fetchFeeHeadsAndClasses } from "@/utils/supabase/supabaseQueries";
import { redirect } from "next/navigation";

import ClassesFeesClient from "./ClassesFeesClient";
import UserLayout from "../../UserLayout";

export default async function ClassWiseFeesPage() {
    const { feeHeads, classes, error } = await fetchFeeHeadsAndClasses();
    if (error?.code === 'NO_PROFILE') {
        redirect('/login');
    }
    
    return (
        <UserLayout pageName='Class-Wise Fees'>
            {feeHeads?.length === 0 || classes?.length === 0 ? (
                <div className="w-full text-center">
                    Either classes or fees not set up. Please go to <span className=" text-primary">settings</span> and set up classes and fees first.
                </div>
            ) : (
                <ClassesFeesClient classesFees={feeHeads ?? []} classes={classes ?? []} />
            )}

        </UserLayout>
    )
}