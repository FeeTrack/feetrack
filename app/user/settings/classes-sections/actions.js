'use server'
import { createServiceSupabase } from '@/utils/supabase/serviceRole';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/utils/supabase/supabaseQueries';

export async function createClassAction(prevState, formData) {
    const supabase = await createServiceSupabase()
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const className = String(formData.get('name') ?? '').trim();
    if (!className) {
        return { error: 'Class name is required.' };
    }
    const hasSections = formData.get('hasSections') === 'on' || formData.get('hasSections') === 'true';

    const sections = [];
    const seen = new Set();
    let duplicate = null;
    if (hasSections) {    
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('section_')) {
                const v = String(value ?? '').trim();
                if (v) {
                    if (seen.has(v)) {
                        duplicate = v;
                        break;
                    }
                    seen.add(v);
                    sections.push(v);
                }
            }
        }
    
        if (duplicate) {
            return { error: `Duplicate section name: ${duplicate}` };
        }
    }

    const { data: classData, error: classErr } = await supabase
        .from('classes')
        .insert({
            name: className,
            school_id: profile.school_id
        })
        .select()
        .single();

    if (classErr) {
        return { error: 'Failed to create class' + classErr.message };
    }

    // insert sections
    if (sections.length > 0) {
        const sectionRows = sections.map((s) => ({name: s, class_id: classData.id, school_id: profile.school_id}));
        const { error: sectionErr } = await supabase
            .from('sections')
            .insert(sectionRows);
        if (sectionErr) {
            await supabase.from('classes').delete().eq('id', classData.id);
            return { error: 'Failed to create sections' + sectionErr.message };
        }
    }

    revalidatePath('/user/classes');
    return { class: classData, status: 'success', message: `Successfully Added Class: ${classData.name}` };
}

export async function updateClassAction(prevState, formData) {
    const supabase = await createServiceSupabase()
    const profile = await getUser();
    if (!profile) return { error: 'Not authenticated' };

    const class_id = String(formData.get('class_id') ?? '').trim();
    if (!class_id) {
        return { error: 'Please select a class.' };
    }
    const className = String(formData.get('name') ?? '').trim();
    if (!className) {
        return { error: 'Class name is required.' };
    }

    const sections = [];

    for (const [key, value] of formData.entries()) {
        if (key.startsWith('section_new_')) {
        const v = String(value ?? '').trim();
        if (v) sections.push({ action: 'create', name: v });
        } else if (key.startsWith('section_delete_')) {
        const id = key.replace('section_delete_', '');
        sections.push({ action: 'delete', id });
        } else if (key.startsWith('section_update_')) {
        const id = key.replace('section_update_', '');
        const v = String(value ?? '').trim();
        sections.push({ action: 'update', id, name: v });
        }
    }

    const { data: updatedClass, error: updateErr } = await supabase
        .from('classes')
        .update({
            name: className
        })
        .eq('id', class_id)
        .select()
        .single();
    if (updateErr) {
        return { error: 'Failed to update class. ' + (updateErr.message || '') };
    }

    // process sections actions (create/update/delete)
    for (const s of sections) {
        if (s.action === 'create') {
        await supabase.from('sections').insert({ name: s.name, class_id: class_id, school_id: profile.school_id});
        } else if (s.action === 'update') {
        await supabase.from('sections').update({ name: s.name }).eq('id', s.id);
        } else if (s.action === 'delete') {
        await supabase.from('sections').delete().eq('id', s.id);
        }
    }
    
    revalidatePath('/user/classes');

    return { class: updatedClass, status: 'success', message: `Successfully Edited Class: ${updatedClass.name}`  };
}