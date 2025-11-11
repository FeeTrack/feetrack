'use client';
import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { createClassAction } from './actions';

export default function CreateClassForm({ onSubmit, onCancel }) {
  const [hasSections, setHasSections] = useState(false);
  const [sections, setSections] = useState(['']); // at least one if checked
  const [state, formAction, pending] = useActionState(createClassAction, { error: null });

  const [formData, setFormData] = useState({
    name: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  useEffect(() => {
    if (state?.status === 'success') {
      setFormData({ name: "" });
      setSections(['']);
    }
    onSubmit(state);
  }, [state]);

  const addSection = () => setSections((s) => [...s, '']);
  const updateSection = (val, i) => setSections((s) => s.map((x, idx) => idx === i ? val : x));
  const removeSection = (i) => setSections((s) => s.filter((_, idx) => idx !== i));

  return (
    <div>
      <form action={formAction} className="space-y-3" id='createClassForm'>
        <div>
          <label className="block text-sm mb-1">Class Name</label>
          <input name="name" required className="w-full border rounded px-2 py-1" value={formData.name} onChange={handleChange} />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="hasSections" name="hasSections" checked={hasSections} onChange={(e) => { setHasSections(e.target.checked); if (e.target.checked && sections.length === 0) setSections(['']); }} />
          <label htmlFor="hasSections" className="text-sm">This class has sections</label>
        </div>

        {hasSections && (
          <div>
            <label className="block text-sm mb-1">Sections</label>
            {sections.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input name={`section_${idx}`} value={val} onChange={(e) => updateSection(e.target.value, idx)} className="flex-1 border rounded px-2 py-1" />
                
                <button type="button" onClick={addSection} className="px-2 py-1 rounded bg-purple-100 border">+</button>
                {idx > 0 ? (
                  <button type="button" onClick={() => removeSection(idx)} className="px-2 py-1 rounded border">−</button>
                ) : (
                  <div className='px-2 py-1 rounded border text-gray-400 cursor-not-allowed'>−</div>
                )}
              </div>
            ))}
          </div>
        )}

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
            form='createClassForm'
            disabled={pending}
          >
            {pending ? 'Adding…' : 'Add Class'}
          </button>
        </div>
      </form>
    </div>
  );
}
