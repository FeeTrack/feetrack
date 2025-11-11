'use client';
import React, { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { createFeeAction } from './actions';

export default function CreateFeeHeadForm({ classes = [], onSubmit, onCancel }) {
  const [applyLate, setApplyLate] = useState(false);
  const [checkedClass, setCheckedClass] = useState({});
  const [state, formAction, pending] = useActionState(createFeeAction, { error: null });

  const dueMonths = [
    { duration: 'monthly', months: 'Of Every Month' },
    { duration: 'half_yearly', months: 'Apr & Oct' },
    { duration: 'yearly', months: 'Apr' },
    { duration: 'once_per_student', months: 'Apr' },
  ]

  const [formData, setFormData] = React.useState({
    name: "",
    duration: "",
    due_date: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
      if (state?.status === 'success') {
        setFormData({ name: "", duration: "", due_date: "" });
        setApplyLate(false);
        setCheckedClass({});
      }
      onSubmit(state);
    }, [state]);

  const toggle = (id) => setCheckedClass((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div>
      <form action={formAction} className="space-y-3" id='createFeeForm'>
        <div>
          <label className="block text-sm mb-1">Fee Title</label>
          <input name="name" required value={formData.name} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>

        <div>
          <label className="block text-sm mb-1">Duration</label>
          <select name="duration" required value={formData.duration} onChange={handleChange} className="w-full border rounded px-2 py-1">
            <option value="">Select Duration</option>
            <option value="monthly">Monthly</option>
            <option value="half_yearly">Half Yearly</option>
            <option value="yearly">Yearly</option>
            <option value="once_per_student">Once Per Student</option>
          </select>
        </div>

        <div className='flex items-center gap-4 md:gap-8'>
          <label className="flex flex-col gap-1">
            <span className='font-medium'>Due Date (Optional)</span>
            <span className="text-xs text-gray-500">
              Day of the month by which fee should be received.
            </span>
          </label>
          <div className='flex items-center gap-2'>
            <input name="due_date" type="number" min="1" max="28" placeholder='15' value={formData.due_date} onChange={handleChange} className="border rounded px-2 py-1 w-6 md:w-10 placeholder:italic" />
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
            <input name="late_amount" type="number" className="border rounded px-2 py-1 w-10 md:w-16" />
          </div>
        )}

        <div>
          <h3 className="font-bold mb-2">Class Wise Amount</h3>
          <div className="grid grid-cols-1 gap-2">
            {classes.map((c) => (
              <div key={c.id} className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={!!checkedClass[c.id]}
                  id={`class_enabled_${c.id}`}
                  name={`class_enabled_${c.id}`}
                  onChange={() => toggle(c.id)}
                />
                <label htmlFor={`class_enabled_${c.id}`} className="w-40">{c.name}</label>

                <input
                  name={`class_amount_${c.id}`}
                  placeholder="Amount"
                  type="number"
                  className="flex-1 border rounded px-2 py-1 disabled:text-[#888]"
                  disabled={!checkedClass[c.id]}
                />
              </div>
            ))}
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
            form='createFeeForm'
            disabled={pending}
          >
            {pending ? 'Adding…' : 'Add Fee'}
          </button>
        </div>
      </form>
    </div>
  );
}