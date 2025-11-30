'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import toast from 'react-hot-toast';

import { addStaffAction } from './actions';

export default function AddStaffForm({ profile, onSubmit, onCancel }) {
  const [state, formAction, pending] = useActionState(addStaffAction, { error: null });
  const [clientErrors, setClientErrors] = useState({})

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    mobile_no: "",
    salary: "",
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
      toast.success('Staff added successfully: ' + formData.name);
      setFormData({ name: "", designation: "", mobile_no: "", salary: "" });
      onSubmit();
    }
    if (state?.error) {
      console.error(state.error);
      toast.error('Error while adding staff.');
      return;
    }
  }, [state]);

  return (
    <>
      <div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          <form action={formAction} onSubmit={handleSubmit} className="space-y-3 w-full" id="addStaffForm">
            <input type="hidden" name="school_id" value={profile.school_id} />

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
                form='addStaffForm'
                disabled={pending}
              >
                {pending ? 'Adding…' : 'Add Staff'}
              </button>
            </div>

          </form>
        </div>
      </div>    
    </>
  )
}