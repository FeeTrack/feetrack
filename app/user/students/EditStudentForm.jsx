'use client'

import { useActionState, useEffect, useState } from "react"
import { updateStudentAction } from "./actions"

export default function EditStudentForm({ student, onCancel, onSubmit, classes, sections }) {
  const [state, formAction, pending] = useActionState(updateStudentAction, { error: null });

  const [filteredSections, setFilteredSections] = useState([]);

  const [formData, setFormData] = useState({
    name: student.name,
    class: student.class_id,
    section: student.section_id,
    roll_no: student.roll_no ?? '',
    father_name: student.father_name,
    mother_name: student.mother_name,
    parent_mobile: student.parent_mobile,
    adm_date: student.adm_date
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  useEffect(() => {
    setFilteredSections(
      sections.filter((row) => row.class_id === formData.class)
    );
  }, [formData.class]);

  useEffect(() => {
    if (state?.error || state?.student) {
      onSubmit(state);
    }
  }, [state]);

  return (
    <div>
      <div className='flex-1 overflow-y-auto p-3'>
        <form action={formAction} className="space-y-3 w-full" id="editStudentForm">
        <input type="hidden" name="studentId" value={student.id} />
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="name" defaultValue={formData.name} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
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
            <select name="section" className="w-full border rounded px-2 py-1 disabled:text-[#888]" required value={formData.section} onChange={handleChange}>
              {filteredSections.map((s) => (
                <option key={s.id} value={s.id} className='text-black'>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Admission No</label>
            <input name="adm_no" className="w-full border read-only:text-[#888] rounded px-2 py-1" defaultValue={student.adm_no} readOnly />
          </div>

          <div>
            <label className="block text-sm mb-1">Admission Date</label>
            <input name="adm_date" type='date' className="w-full border rounded px-2 py-1" value={formData.adm_date} onChange={handleChange} />
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
              form='editStudentForm'
              disabled={pending}
            >
              {pending ? 'Updating…' : 'Update'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}