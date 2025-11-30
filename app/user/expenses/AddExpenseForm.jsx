'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import toast from 'react-hot-toast';

import { addExpenseAction } from './actions';

export default function AddExpenseForm({ profile, expenseTypes, staff, currentSession, onSubmit, onCancel }) {
  const [state, formAction, pending] = useActionState(addExpenseAction, { error: null });
  const [clientErrors, setClientErrors] = useState({})

  const [selectedExpType, setSelectedExpType] = useState({})
  const [selectedStaff, setSelectedStaff] = useState({})
  const [showSalary, setShowSalary] = useState(false)

  const [formData, setFormData] = useState({
    expenseType: "",
    selectedStaff: '',
    amount: '',
    expenseDate: '',
    description: ''
  });

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'description') {
      if (value.length > 180) {
        const charsLeft = 200 - value.length;
        setClientErrors(prev => ({...prev, description: `${charsLeft} characters left`}))
      } else {
        setClientErrors(prev => ({...prev, description: ''}))
      }
    }
  }

  const validateForm = () => {
    const errors = {};

    if (!formData.expenseType) {
      errors.name = "Please select an expense type"
    }
    if (!formData.amount) {
      errors.name = "Please enter the amount"
    }
    if (!formData.expenseDate) {
      errors.name = "Please enter the expense date"
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
      toast.success('Expense recorded successfully.');
      setFormData({ expenseType: "", selectedStaff: '', amount: '', expenseDate: '', description: '' });
      setSelectedExpType({})
      onSubmit();
    }
    if (state?.error) {
      console.error(state.error)
      toast.error('Failed to record expense.')
    }
  }, [state]);

  return (
    <>
      <div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          <form action={formAction} onSubmit={handleSubmit} className="space-y-3 w-full" id="addExpenseForm">
            <input type="hidden" name="school_id" value={profile.school_id} />
            <input type="hidden" name="session_id" value={currentSession.id} />

            <div>
              <label className="block text-sm mb-1">Expense Type</label>
              <select name='expenseType' className="w-full border rounded px-2 py-1" value={formData.expenseType}
                onChange={e => {
                    const id = e.target.value;
                    const exp = expenseTypes.find(et => et.id === id)
                    setSelectedExpType(exp || {})
                    handleChange(e)
                }}
            >
                <option value='' className='text-black'>Select Type</option>
                {expenseTypes.map(et => (
                    <option key={et.id} value={et.id} className='text-black'>
                        {et.name}
                    </option>
                ))}
              </select>
            </div>
            {clientErrors.expenseType && (
              <p className='text-red-600 text-xs mt-1'>{clientErrors.expenseType}</p>
            )}

            <input type='hidden' name='isSalaryHead' value={selectedExpType.is_salary_head ? true : false }  />

            {selectedExpType.is_salary_head && (
                <div>
                    <div className='flex justify-between items-center'>
                        <label className="block text-sm mb-1">Select Staff</label>
                        
                        {profile.role === 'admin' && selectedStaff.id && (
                            <button className='primary-btn text-xs mb-1' onClick={() => setShowSalary(prev => !prev)}>
                                {showSalary ? 'Hide' : 'View'} Salary
                            </button>
                        )}
                    </div>
                    <select name='selectedStaff' className="w-full border rounded px-2 py-1" value={formData.selectedStaff}
                        onChange={e => {
                            const id = e.target.value
                            const stf = staff.find(s => s.id === id)
                            setSelectedStaff(stf || {})
                            handleChange(e)
                        }}
                    >
                        <option value='' className='text-black'>Select Staff</option>
                        {staff.map(s => (
                            <option key={s.id} value={s.id} className='text-black'>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedStaff.id && showSalary && (
              <div>
                  <label className="block text-sm mb-1">Salary</label>
                  <input disabled value={selectedStaff.salary ? selectedStaff.salary : ''} className='w-full border rounded px-2 py-1 disabled:bg-gray-100'></input>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1">Expense Amount</label>
              <input name="amount" type='number' value={formData.amount} onChange={handleChange} className="w-full border rounded px-2 py-1" />
            </div>
            {clientErrors.amount && (
              <p className='text-red-600 text-xs mt-1'>{clientErrors.amount}</p>
            )}

            <div>
              <label className="block text-sm mb-1">Expense Date</label>
              <input name="expenseDate" type='date' value={formData.expenseDate} onChange={handleChange} className="w-full border rounded px-2 py-1" min={currentSession.start_date} max={currentSession.end_date} />
            </div>
            {clientErrors.expenseDate && (
              <p className='text-red-600 text-xs mt-1'>{clientErrors.expenseDate}</p>
            )}

            <div>
              <label htmlFor='description' className="block text-sm mb-1">Description (if any)</label>
              <textarea 
                name='description'
                className='w-full border rounded px-2 py-1'
                value={formData.description}
                onChange={handleChange}
                rows={3}
                maxLength={200}
              />
            </div>
            {clientErrors.description && (
              <p className='text-red-600 text-xs mt-1'>{clientErrors.description}</p>
            )}
            
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
                form='addExpenseForm'
                disabled={pending}
              >
                {pending ? 'Recording…' : 'Record Expense'}
              </button>
            </div>

          </form>
        </div>
      </div>    
    </>
  )
}