"use server"
import { cache } from "react";
import { createServerSupabase } from "./server";

export const getUser = cache(async () => {
    const supabase = await createServerSupabase();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (!userData?.user || authError) return null;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, school_id, schools(name, plan, valid_till)')
        .eq('id', userData.user.id)
        .single();
    if (!profile) {
        console.error('Profile not found for user:', userData.user.id);
        return null;
    }
    if (profileError) {
        console.error("Error fetching profile:", profileError);
        return null
    };

    if (!profile?.school_id) {
        console.error('School not set for your account.');
        return null;
    }

    const validTill = new Date(profile?.schools?.valid_till);
    validTill.setHours(23,59,59,999); // set to end of the day

    const today = new Date();
    today.setHours(0,0,0,0); // set to start of the day

    if (validTill < today) {
        // if (profile?.schools?.plan !== 'free') {
        console.error('School subscription has expired.');
        await supabase.auth.signOut();
        return null;
    }

    return profile;
});

export const fetchFeeHeadsAndClasses = cache(async () => {
    const supabase = await createServerSupabase();
    const profile = await getUser();
    if (!profile) return { error: {message: 'Not Authenticated.', code: 'NO_PROFILE'} };
    
    const { data: classes, error: clsError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('name', { ascending: true });
    if (clsError) {
        console.error("Error fetching classes:", clsError);
        return { classes: [] };
    }
    if (classes.length === 0) {
        return { classes: [] };
    }
    const { data: feeHeads, error: fhError } = await supabase
        .from('fee_heads')
        .select('id, name, duration, due_date, late_fee(id, amount), fee_structures(id, classes(id, name), amount)')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: true });
    if (fhError) {
        console.error("Error fetching fee heads:", fhError);
        return { feeHeads: [], classes };
    }
    if (feeHeads.length === 0) {
        return { feeHeads: [], classes };
    }

    return { feeHeads, classes };
})