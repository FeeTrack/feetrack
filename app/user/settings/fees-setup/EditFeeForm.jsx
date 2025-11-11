'use client';
import React, { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { updateFeeAction } from './actions';

export default function EditFeeForm({ classes = [], fee, onSubmit, onCancel }) {
  const [applyLate, setApplyLate] = useState(Array.isArray(fee?.late_fee) && fee.late_fee.length > 0);

  const initialChecked = {};
  const initialAmounts = {};
  (fee.fee_structures || []).forEach((fs) => {
    if (fs?.class_id) {
      initialChecked[fs.class_id] = true;
      initialAmounts[fs.class_id] = String(fs.amount ?? '');
    }
  });

  const dueMonths = [
    { duration: 'monthly', months: 'Of Every Month' },
    { duration: 'half_yearly', months: 'Apr & Oct' },
    { duration: 'yearly', months: 'Apr' },
    { duration: 'once_per_student', months: 'Apr' },
  ]

  const [formData, setFormData] = useState({
    name: fee.name || '',
    duration: fee.duration || '',
    due_date: fee.due_date || '',
    late_amount: fee.late_fee?.[0]?.amount || ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const [checkedClass, setCheckedClass] = useState(initialChecked);
  const [amountValues, setAmountValues] = useState(initialAmounts);
  const [state, formAction, pending] = useActionState(updateFeeAction, { error: null });

  useEffect(() => {
    if (state?.error || state?.fee_head) {
        onSubmit(state)
    }
  }, [state]);

  const toggle = (id) => {
    setCheckedClass((s) => {
      const next = { ...s, [id]: !s[id] };
      // if unchecked, clear amount for UI
      if (!next[id]) {
        setAmountValues((a) => {
          const copy = { ...a };
          delete copy[id];
          return copy;
        });
      }
      return next;
    });
  };

  return (
    <div>
      <form action={formAction} className="space-y-3" id='editFeeForm'>
        <input type="hidden" name="fee_head_id" value={fee.id} />
        <div>
          <label className="block text-sm mb-1">Fee Title</label>
          <input name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
        </div>

        <div>
          <label className="block text-sm mb-1">Duration</label>
          <select name="duration" required className="w-full border rounded px-2 py-1" value={formData.duration} onChange={handleChange}>
            <option value="">Select duration</option>
            <option value="monthly">Monthly</option>
            <option value="half_yearly">Half Yearly</option>
            <option value="yearly">Yearly</option>
            <option value="once_per_student">Once Per Student</option>
          </select>
        </div>

        <div className='flex items-center gap-4 md:gap-8'>
          <label className="flex flex-col gap-1 font-medium">
            <span>Due Date (Optional)</span>
            <span className="text-xs text-gray-500">
              Day of the month by which fee should be received.
            </span>
          </label>
          <div className='flex items-center gap-2'>
            <input name="due_date" type="number" min="1" max="28" value={formData.due_date} onChange={handleChange} className="w-full border rounded px-2 py-1" />
            <p className='text-gray-600 italic transition-all duration-200'>{dueMonths.find(month => month.duration === formData.duration)?.months}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="applyLate" name="applyLate" type="checkbox" checked={applyLate} onChange={(e) => setApplyLate(e.target.checked)} />
          <label htmlFor="applyLate">Apply Late Fee?</label>
        </div>

        {applyLate && (
          <div className='flex items-center gap-4 md:gap-8'>
            <label className="flex flex-col gap-1">
              <span>Late Fee Amount</span>
              <span className="text-xs text-gray-500">
                Applied once, after the due date.
              </span>
            </label>
            <input name="late_amount" type="number" className="w-full border rounded px-2 py-1" value={formData.late_amount} onChange={handleChange} />
          </div>
        )}

        <div>
          <h3 className="font-bold mb-2">Class Wise Amount</h3>
          <div className="grid grid-cols-1 gap-2">
            {classes.map((c) => {
              const isChecked = Boolean(checkedClass[c.id])
              return (
              <div key={c.id} className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id={`class_enabled_${c.id}`}
                  name={`class_enabled_${c.id}`}
                  defaultChecked={isChecked}
                  onChange={() => toggle(c.id)}
                />
                <label htmlFor={`class_enabled_${c.id}`} className="w-40">{c.name}</label>

                <input
                  name={`class_amount_${c.id}`}
                  placeholder="Amount"
                  type="number"
                  defaultValue={amountValues[c.id] ?? ''}
                  className="flex-1 border rounded px-2 py-1"
                  disabled={!checkedClass[c.id]}
                />
              </div>
            )})}
          </div>
        </div>

        <div className='px-2 py-2 flex justify-end gap-2'>
          <button
            onClick={onCancel}
            className="primary-btn bg-gray-200 hover:bg-gray-300 text-black"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-btn"
            form='editFeeForm'
            disabled={pending}
          >
            {pending ? 'Updating…' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}