'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import toast from 'react-hot-toast';

import { updateStaffAction } from './actions';

export default function EditStaffForm({ staff, onSubmit, onCancel }) {
  const [state, formAction, pending] = useActionState(updateStaffAction, { error: null });
  const [clientErrors, setClientErrors] = useState({})

  const [formData, setFormData] = useState({
    name: staff.name,
    designation: staff.designation,
    mobile_no: staff.mobile_no,
    salary: staff.salary,
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
      errors.name = "Please enter staff name"
    }
    if (!formData.designation) {
      errors.designation = "Please enter staff designation"
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
      toast.success('Staff updated successfully: ' + formData.name)
      onSubmit();
    }
    if (state?.error) {
      console.error(state.error)
      toast.error('Error while updating staff.')
    }
  }, [state]);

  return (
    <>
      <div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          <form action={formAction} onSubmit={handleSubmit} className="space-y-3 w-full" id="updateStaffForm">
            <input type="hidden" name="staff_id" value={staff.id} />

            <div>
              <label className="block text-sm mb-1">Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full border rounded px-2 py-1" />
            </div>
            {clientErrors.name && (
              <p className='text-red-600 text-xs mt-1'>{clientErrors.name}</p>
            )}

            <div>
              <label className="block text-sm mb-1">Designation</label>
              <input name="designation" value={formData.designation} onChange={handleChange} className="w-full border rounded px-2 py-1" />
            </div>
            {clientErrors.designation && (
              <p className='text-red-600 text-xs mt-1'>{clientErrors.designation}</p>
            )}

            <div>
              <label className="block text-sm mb-1">Mobile No.</label>
              <input name="mobile_no" type='tel' pattern='[0-9]{10}' value={formData.mobile_no} onChange={handleChange} className="w-full border rounded px-2 py-1" />
            </div>

            <div>
              <label className="block text-sm mb-1">Salary</label>
              <input name="salary" type='number' value={formData.salary} onChange={handleChange} className="w-full border rounded px-2 py-1" />
            </div>
            
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
                form='updateStaffForm'
                disabled={pending}
              >
                {pending ? 'Updating…' : 'Update Staff'}
              </button>
            </div>

          </form>
        </div>
      </div>    
    </>
  )
}