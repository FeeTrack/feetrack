'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { updateTransportRouteAction } from './actions';

export default function EditTransportRoutesForm({ route, onSubmit, onCancel }) {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clientErrors, setClientErrors] = useState({})
  
  const [formData, setFormData] = useState({
    id: route.id,
    name: route.name,
    monthlyFee: route.monthly_fee,
    vehicleNo: route.vehicle_no
  })

  const handleChange = (e) => {
    setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    const errors = {};

    if (!formData.name) {
        errors.name = 'Please enter route name'
    }
    if (!formData.monthlyFee) {
        errors.monthlyFee = 'Please enter monthly fee'
    }

    return errors;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return
    }
    setClientErrors({})
    setLoading(true)

    try {
      const res = await updateTransportRouteAction( formData )
      setState(res)
    } catch (error) {
      console.error(error)
      toast.error('Failed to update transport route.')
    } finally {
      setLoading(false)
    }

  }

  useEffect(() => {
    if (state?.success) {
      toast.success('Transport route updated successfully.');
      setFormData({name: "", monthlyFee: '', vehicleNo: ''});
      onSubmit();
    }
    if (state?.error) {
      console.error(state.error)
      toast.error('Failed to update transport route.')
    }
  }, [state]);

  return (
    <>
      <div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          <form onSubmit={handleSubmit} className="space-y-3 w-full" id="editTransportRoutesForm">

            <div>
                <label className="block text-sm mb-1">Route</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                {clientErrors.name && (
                <p className='text-red-600 text-xs mt-1'>{clientErrors.name}</p>
                )}
            </div>

            <div className='w-full flex items-center gap-4'>
                <div className='w-full'>
                    <label className="block text-sm mb-1">Monthly Fee</label>
                    <input name="monthlyFee" type='number' value={formData.monthlyFee} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                    {clientErrors.monthlyFee && (
                        <p className='text-red-600 text-xs mt-1'>{clientErrors.monthlyFee}</p>
                    )}
                </div>

                <div className='w-full'>
                    <label className="block text-sm mb-1">Vehicle No</label>
                    <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                </div>
            </div>

            <div className='mt-8 px-2 py-2 flex justify-end gap-2'>
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
                form='editTransportRoutesForm'
                disabled={loading}
              >
                {loading ? 'Updating…' : 'Update Route'}
              </button>
            </div>

          </form>
        </div>
      </div>    
    </>
  )
}