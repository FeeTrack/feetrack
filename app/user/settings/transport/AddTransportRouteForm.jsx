'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { addTransportRoutesAction } from './actions';

export default function AddTransportRoutesForm({ profile, onSubmit, onCancel }) {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clientErrors, setClientErrors] = useState({})

  const [routesToAdd, setRoutesToAdd] = useState({[1]: {name: '', monthlyFee: '', vehicleNo: ''}})
  const [nextIndex, setNextIndex] = useState(2)

  const handleChange = (e, index) => {
    setRoutesToAdd(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [e.target.name]: e.target.value
      }
    }))
  }

  const addNewRoute = () => {
    setRoutesToAdd(prev => ({
      ...prev,
      [nextIndex]: {name: '', monthlyFee: '', vehicleNo: ''}
    }))
    setNextIndex(prev => prev + 1)
  }

  const removeRoute = (index) => {
    setRoutesToAdd(prev => {
      const updatedRoutes = {...prev}
      delete updatedRoutes[index]
      return updatedRoutes
    })
  }

  const validateForm = () => {
    const errors = {};

    Object.entries(routesToAdd).forEach(([routeIndex, routeData]) => {
      if (!routeData.name) {
        errors[`name_${routeIndex}`] = 'Please enter route name'
      }
      if (!routeData.monthlyFee) {
        errors[`monthly_fee_${routeIndex}`] = 'Please enter monthly fee'
      }
    })

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

    const addedRoutesArray = Object.entries(routesToAdd).map(([routeIndex, routeData]) => ({
      route_index: routeIndex,
      name: routeData.name,
      monthly_fee: routeData.monthlyFee,
      vehicle_no: routeData.vehicleNo
    }))

    try {
      const res = await addTransportRoutesAction( profile.school_id, addedRoutesArray)
      setState(res)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add transport routes.')
    } finally {
      setLoading(false)
    }

  }

  useEffect(() => {
    if (state?.success) {
      toast.success('Transport routes added successfully.');
      setRoutesToAdd({[1]: {name: "", monthlyFee: '', vehicleNo: ''}});
      onSubmit();
    }
    if (state?.error) {
      console.error(state.error)
      toast.error('Failed to add transport routes.')
    }
  }, [state]);

  return (
    <>
      <div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          <form onSubmit={handleSubmit} className="space-y-3 w-full" id="addTransportRoutesForm">

            {Object.entries(routesToAdd).map(([routeIndex, routeData]) => (
              <div key={routeIndex} className='w-full flex flex-col gap-4'>
                <div>
                  <label className="block text-sm mb-1">Route Name</label>
                  <input name="name" value={routeData.name} onChange={e => handleChange(e, routeIndex)} className="w-full border rounded px-2 py-1" placeholder='Ex: School - Civil Lines' />
                  {clientErrors[`name_${routeIndex}`] && (
                    <p className='text-red-600 text-xs mt-1'>{clientErrors[`name_${routeIndex}`]}</p>
                  )}
                </div>

                <div className='w-full flex items-center gap-4'>
                  <div className='w-full'>
                    <label className="block text-sm mb-1">Monthly Fee</label>
                    <input name="monthlyFee" type='number' value={routeData.monthlyFee} onChange={e => handleChange(e, routeIndex)} className="w-full border rounded px-2 py-1" />
                    {clientErrors[`monthly_fee_${routeIndex}`] && (
                      <p className='text-red-600 text-xs mt-1'>{clientErrors[`monthly_fee_${routeIndex}`]}</p>
                    )}
                  </div>

                  <div className='w-full'>
                    <label className="block text-sm mb-1">Vehicle No</label>
                    <input name="vehicleNo" value={routeData.vehicleNo} onChange={e => handleChange(e, routeIndex)} className="w-full border rounded px-2 py-1" />
                  </div>
                </div>

                <div className='justify-end flex items-center gap-2'>
                  {Object.keys(routesToAdd).length > 1 && routeIndex !== '1' && (
                    <button 
                      type='button' 
                      onClick={() => removeRoute(routeIndex)}
                      className='text-xs font-medium text-red-600 hover:underline cursor-pointer'
                    >
                      Remove
                    </button>
                  )}
                  <button 
                    type='button' 
                    onClick={addNewRoute} // Fix: actually add new route
                    className='text-xs font-medium hover:underline cursor-pointer'
                  >
                    Add More
                  </button>
                </div>
              </div>
            ))}

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
                form='addTransportRoutesForm'
                disabled={loading}
              >
                {loading ? 'Adding…' : 'Add Routes'}
              </button>
            </div>

          </form>
        </div>
      </div>    
    </>
  )
}