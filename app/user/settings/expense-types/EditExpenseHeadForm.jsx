'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import toast from 'react-hot-toast';

import { updateExpenseHeadAction } from './actions';
import { Info } from 'lucide-react';

export default function EditExpenseHeadForm({ expenseHead, expenseHeads, onSubmit, onCancel }) {
  const [state, formAction, pending] = useActionState(updateExpenseHeadAction, { error: null });
  const [clientErrors, setClientErrors] = useState({})

  const [formData, setFormData] = useState({
    name: expenseHead.name,
    is_salary_head: expenseHead.is_salary_head
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  const validateForm = () => {
    const errors = {};

    if (!formData.name) {
      errors.name = "Please enter expense title"
    }
    
    if (formData.is_salary_head) {
      const salaryHeadExists = expenseHeads.find(e => e.is_salary_head && e.id !== expenseHead.id)
      if (salaryHeadExists) {
          errors.is_salary_head = "Expense type for staff salary already exists."
      }
    }

    return errors;
  }

  const handleSubmit = (e) => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setClientErrors(errors);
      return
    }
    setClientErrors({})
  }

  useEffect(() => {
    if (state?.success) {
      toast.success('Expense type updated successfully: ' + formData.name);
      onSubmit();
    }
    if (state?.error) {
      console.error(state.error)
      toast.error('Error while updating expense type.')
    }
  }, [state]);

  return (
    <>
      <div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          <form action={formAction} onSubmit={handleSubmit} className="space-y-3 w-full" id="editExpenseHeadForm">
            <input type='hidden' name='expense_head_id' value={expenseHead.id} />

            <div>
              <label className="block text-sm mb-1">Expense Title</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              {clientErrors.name && (
                <p className='text-red-600 text-xs mt-1'>{clientErrors.name}</p>
              )}
            </div>

            {expenseHead.is_salary_head ? (
              <div className='w-full flex items-center gap-2'>
                <Info className='w-4 h-4' />
                <p>This expense type is for staff salary.</p>
              </div>
            ) : !expenseHeads.find(e => e.is_salary_head) ? (
              <div>
                <label className='flex items-center gap-2 ml-1'>
                  <input type='checkbox' name='is_salary_head' checked={formData.is_salary_head} onChange={(e) => setFormData(prev => ({...prev, is_salary_head: e.target.checked}))} />
                  <p>Is this expense type for Staff Salary?</p>
                </label>
                {clientErrors.is_salary_head && (
                  <p className='text-red-600 text-xs mt-1'>{clientErrors.is_salary_head}</p>
                )}
              </div>
            ) : null}
            
            <div className='px-2 py-2 flex justify-end gap-2'>
              <button
                type='button'
                onClick={onCancel}
                className="primary-btn bg-gray-200 hover:bg-gray-300 text-black"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn"
                form='editExpenseHeadForm'
                disabled={pending}
              >
                {pending ? 'Updating…' : 'Update Expense Type'}
              </button>
            </div>

          </form>
        </div>
      </div>    
    </>
  )
}