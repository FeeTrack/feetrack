'use server';
import { createServerSupabase } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/utils/supabase/supabaseQueries';

// Create Fee
export async function createFeeAction(prevState, formData) {
  const supabase = await createServerSupabase();
  const profile = await getUser();
  if (!profile) return { error: 'Not authenticated' };

  const { data: sessionId, error: sessionErr } = await supabase
    .from('academic_sessions')
    .select('id')
    .eq('is_active', true)
    .single();

  if (sessionErr || !sessionId?.id) {
    return { error: 'Academic session not found. Please contact admin.' + sessionErr.message };
  }
  
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Fee title is required.' };

  const duration = String(formData.get('duration') ?? '').trim(); // 'monthly'|'yearly'|'semester'|'once_per_student'
  if (!duration) return { error: 'Duration is required.' };

  const due_date = parseInt(formData.get('due_date') ?? '', 10);
  if (due_date < 1 || due_date > 28) return { error: 'Due date must be between 1 and 28.' };

  const applyLate = formData.get('applyLate') === 'on' || formData.get('applyLate') === 'true';

  if (applyLate && (duration === 'once_per_student' || duration === 'yearly')) {
    return { error: 'Late fee cannot be applied for Yearly or Once Per Student fees.' };
  }

  const lateAmountRaw = formData.get('late_amount');
  const lateAmount = Number(String(lateAmountRaw));

  if (applyLate && (!lateAmount || isNaN(lateAmount) || lateAmount <= 0)) {
    return { error: 'Positive late fee amount is required.' };
  }

  const selections = [];
  for (const [k, v] of formData.entries()) {
    if (k.startsWith('class_enabled_')) {
      const classId = k.replace('class_enabled_', '');
      const amtRaw = formData.get(`class_amount_${classId}`);
      const amt = amtRaw ? Number(String(amtRaw)) : null;
      if (!amt || isNaN(amt) || amt <= 0) {
        return { error: `The selected classes must have a positive fee.` };
      }
      selections.push({ classId, amount: amt });
    }
  }

  // Insert fee_head
  const { data: feeHead, error: headErr } = await supabase
    .from('fee_heads')
    .insert({
      name,
      duration,
      due_date,
      school_id: profile.school_id
    })
    .select()
    .single();

  if (headErr) {
    return { error: 'Failed to create fee head' + headErr.message };
  }

  // Insert late_fee if requested
  if (applyLate) {
    const { error: lateFeeErr } = await supabase.from('late_fee').insert({
      fee_head_id: feeHead.id,
      amount: lateAmount
    });

    if (lateFeeErr) {
      // cleanup head on failure (best-effort)
      await supabase.from('fee_heads').delete().eq('id', feeHead.id);
      return { error: 'Failed to create late fee.' + lateFeeErr.message };
    }
  }
  
  // Insert fee_structures
  if (selections.length > 0) {
    const feeStructureRows = selections.map((s) => ({
      session_id: sessionId.id,
      fee_head_id: feeHead.id,
      class_id: s.classId,
      amount: s.amount,
    }));

    const { error: structureErr } = await supabase.from('fee_structures').insert(feeStructureRows);

    if (structureErr) {
      // cleanup head on failure (best-effort)
      await supabase.from('fee_heads').delete().eq('id', feeHead.id);
      return { error: 'Failed to create fee structures.' + structureErr.message };
    }
  }

  revalidatePath('/user/fees/setup');
  return { fee_head: feeHead, status: 'success', message: `Successfully Created Fee: ${feeHead.name}` };
}

// Update Fees Structure
export async function updateFeeAction(prevState, formData) {
  const supabase = await createServerSupabase();
  const profile = await getUser();
  if (!profile) return { error: 'Not authenticated' };


  const { data: sessionId, error: sessionErr } = await supabase
    .from('academic_sessions')
    .select('id')
    .eq('is_active', true)
    .single();

  if (sessionErr || !sessionId?.id) {
    return { error: 'Academic session not found. Please contact admin.' };
  }

  const id = String(formData.get('fee_head_id') ?? '').trim();
  if (!id) return { error: 'Please select a fee type.' };

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Fee title is required.' };

  const duration = String(formData.get('duration') ?? '').trim(); // 'monthly'|'yearly'|'semester'|'once_per_student'
  if (!duration) return { error: 'Duration is required.' };

  const due_date = parseInt(formData.get('due_date') ?? '', 10);
  if (due_date < 1 || due_date > 28) return { error: 'Due date must be between 1 and 28.' };

  const applyLate = formData.get('applyLate') === 'on' || formData.get('applyLate') === 'true';

  if (applyLate && (duration === 'once_per_student' || duration === 'yearly')) {
    return { error: 'Late fee cannot be applied for Yearly or Once Per Student fees.' };
  }

  const lateAmountRaw = formData.get('late_amount');
  const lateAmount = Number(String(lateAmountRaw));

  if (applyLate && (!lateAmount || isNaN(lateAmount) || lateAmount <= 0)) {
    return { error: 'Late fee duration and positive amount are required.' };
  }

  const selections = [];
  for (const [k, v] of formData.entries()) {
    if (k.startsWith('class_enabled_')) {
      const classId = k.replace('class_enabled_', '');
      const amtRaw = formData.get(`class_amount_${classId}`);
      const amt = amtRaw ? Number(String(amtRaw)) : null;
      if (!amt || isNaN(amt) || amt <= 0) {
        return { error: `The selected classes must have a positive fee.` };
      }
      selections.push({ classId, amount: amt });
    }
  }

  // update head
  const { data: updated, error: updErr } = await supabase
    .from('fee_heads')
    .update({ name, duration, due_date })
    .eq('id', id)
    .select()
    .single();

  if (updErr) {
    return { error: 'Failed to update fee head.' + updErr.message };
  }

  // manage late_fees
  const { data: existingLate } = await supabase.from('late_fees').select('*').eq('fee_head_id', id).maybeSingle();

  if (applyLate) {
    if (existingLate) {
      // update
      await supabase.from('late_fees').update({ amount: lateAmount }).eq('id', existingLate.id);
    } else {
      // insert
      await supabase.from('late_fees').insert({ fee_head_id: id, amount: lateAmount });
    }
  } else {
    // remove late fee if exists
    if (existingLate) {
      await supabase.from('late_fees').delete().eq('id', existingLate.id);
    }
  }

  //here manage fee_structures
  // delete existing structures for this head & session
  const { error: delErr } = await supabase.from('fee_structures').delete().eq('fee_head_id', id).eq('session_id', sessionId.id);
  if (delErr) {
    return { error: 'Failed to recreate fee structures. ' + delErr.message };
  }
  if (selections.length > 0) {
    const feeStructureRows = selections.map(s => ({
      session_id: sessionId.id,
      fee_head_id: id,
      class_id: s.classId,
      amount: s.amount
    }));
    const { error: insErr } = await supabase.from('fee_structures').insert(feeStructureRows);
    if (insErr) {
      return { error: 'Failed to save class amounts. Try again.' + insErr.message};
    }
  }

  revalidatePath('/user/fees/setup');
  return { fee_head: updated, status: 'success', message: `Successfully Updated Fee: ${updated.name}` };
}