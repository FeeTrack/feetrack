'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { createStudentAction } from './actions';

import Select from 'react-select';
import { useSession } from '../../../Context/SessionContext';

export default function AddStudentForm({ onSubmit, onCancel, classes, sections, admNo, schoolType, transportRoutes }) {
  const [state, formAction, pending] = useActionState(createStudentAction, { error: null });

  const [filteredSections, setFilteredSections] = useState([]);
  
  const today = new Date().toISOString().split('T')[0];

  const { currentSession } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    class: "",
    section: "",
    roll_no: "",
    father_name: "",
    mother_name: "",
    parent_mobile: "",
    adm_date: today,
    availTransport: false
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  const routeOptions = transportRoutes?.map(route => ({
    label: route.name,
    value: route.id
  }))

  const [selectedRoute, setSelectedRoute] = useState(null)

  const routeFee = transportRoutes.find(route => route.id === selectedRoute?.value)?.monthly_fee || null;
  
  useEffect(() => {
    setFilteredSections(
      sections.filter((row) => row.class_id === formData.class)
    );
  }, [formData.class]);

  useEffect(() => {
    if (state?.status === 'success') {
      setFormData({ name: "", class: "", section: "", roll_no: "", father_name: '', mother_name: '', parent_mobile: "", adm_date: today, availTransport: false });
    }
    onSubmit(state);
  }, [state]);

  return (
    <>
      <div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          <form action={formAction} className="space-y-3 w-full" id="addStudentForm">
            <input type="hidden" name="session" value={JSON.stringify(currentSession)} />

            <div>
              <label className="block text-sm mb-1">Name</label>
              <input name="name" required value={formData.name} onChange={handleChange} className="w-full border rounded px-2 py-1" />
            </div>

            <div>
              <label className="block text-sm mb-1">Class</label>
              <select name="class" className="w-full border rounded px-2 py-1" required value={formData.class} onChange={handleChange}>
                <option value="" className='text-black'>Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id} className='text-black'>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Section</label>
              <select name="section" className="w-full border rounded px-2 py-1 disabled:text-[#888]" required disabled={!formData.class} value={formData.section} onChange={handleChange}>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id} className='text-black'>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Admission No</label>
              <input name="adm_no" className="w-full border read-only:text-[#888] rounded px-2 py-1" value={state?.student?.adm_no ? parseInt(state.student.adm_no) + 1 : admNo} readOnly />
            </div>

            <div>
              <label className="block text-sm mb-1">Admission Date</label>
              <input name="adm_date" type='date' className="w-full border rounded px-2 py-1" value={formData.adm_date || ''} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm mb-1">Roll No</label>
              <input name="roll_no" type='number' className="w-full border rounded px-2 py-1" value={formData.roll_no} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm mb-1">Father's Name</label>
              <input name="father_name" className="w-full border rounded px-2 py-1" value={formData.father_name} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm mb-1">Mother's Name</label>
              <input name="mother_name" className="w-full border rounded px-2 py-1" value={formData.mother_name} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm mb-1">Parent's Contact</label>
              <input name="parent_mobile" type='tel' pattern='[0-9]{10}' className="w-full border rounded px-2 py-1" required value={formData.parent_mobile} onChange={handleChange} />
            </div>

            <div>
              <label className='flex items-center gap-1 text-sm ml-1'>
                <input type='checkbox' name='avail_transport' checked={formData.availTransport} onChange={(e) => {setFormData(prev => ({...prev, availTransport: e.target.checked})); setSelectedRoute(null)}} />
                <p>Avail Transport</p>
              </label>
            </div>

            {formData.availTransport && (
              <div>
                <label className='block text-sm mb-1'>Transport Route</label>
                <div className="w-full px-1">
                  <Select
                    styles={{
                      control: (base) => ({
                      ...base,
                      width: '100%',
                      }),
                      container: (base) => ({
                      ...base,
                      width: '100%'
                      }),
                      menuList: (base) => ({
                          ...base,
                          maxHeight: '200px',
                          overflowY: 'auto',
                      }),
                    }}
                    instanceId='transport-route-select'
                    options={routeOptions}
                    value={selectedRoute}
                    onChange={setSelectedRoute}
                    placeholder="Select Route"
                    isClearable
                  />
                  <input type="hidden" name="routeId" value={selectedRoute?.value || ''} />
                </div>
              </div>
            )}  

            {routeFee && (
              <div>
                <label className="block text-sm mb-1">Route's Monthly Fee</label>
                <input disabled value={routeFee} className='w-full border rounded px-2 py-1 disabled:bg-gray-100'></input>
              </div>
            )}

            <div className='flex items-center gap-6 text-sm'>
              <div>
                <p>Apply Monthly Fees From</p>

                <p className='text-xs text-gray-600'>(Date from which monthly fees is applied to the student)</p>
              </div>
              <div className='flex items-center gap-4'>
                <label className='flex items-center gap-1'>
                  <input type='radio' name='month_fee_from' value='session_start' defaultChecked={schoolType !== 'tuition'} />
                  Session Start
                </label>
                <label className='flex items-center gap-1'>
                  <input type='radio' name='month_fee_from' value='adm_date' defaultChecked={schoolType === 'tuition'} />
                  Admission Date
                </label>
              </div>
            </div>

            <div>
              <label className='flex items-center gap-1 text-sm ml-1'>
                <input type='checkbox' name='gen_fee' />
                <p>Generate Fee Based on Class</p>
              </label>
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
                form='addStudentForm'
                disabled={pending}
              >
                {pending ? 'Adding…' : 'Add Student'}
              </button>
            </div>

          </form>
        </div>
      </div>    
    </>
  )
}
