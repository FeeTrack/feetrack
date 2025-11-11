'use client';
import React, { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { updateClassAction } from './actions';

export default function EditClassForm({ classObj, onSubmit, onCancel }) {
  const [state, formAction, pending] = useActionState(updateClassAction, { error: null });
  const [hasSections, setHasSections] = useState(Array.isArray(classObj.sections) && classObj.sections.length > 0);
  const existingSections = Array.isArray(classObj.sections) ? classObj.sections : [];
  const [newSections, setNewSections] = useState(['']); // names for new sections

  useEffect(() => {
    if (state?.error || state?.class) onSubmit(state);
  }, [state]);

  const addNewSection = () => setNewSections((s) => [...s, '']);
  const updateNewSection = (i, val) => setNewSections((s) => s.map((x, idx) => idx === i ? val : x));
  const removeNewSection = (i) => setNewSections((s) => s.filter((_, idx) => idx !== i));

  return (
    <div>
      <form action={formAction} className="space-y-3" id='editClassForm'>
        <input type="hidden" name="class_id" value={classObj.id} />
        <div>
          <label className="block text-sm mb-1">Class Name</label>
          <input name="name" defaultValue={classObj.name} required className="w-full border rounded px-2 py-1" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="hasSections" name="hasSections" checked={hasSections} onChange={(e) => setHasSections(e.target.checked)} />
          <label htmlFor="hasSections" className="text-sm">This class has sections</label>
        </div>

        {hasSections && (
          <div>
            <label className="block text-sm mb-1">Existing sections</label>
            {existingSections.length === 0 && <div className="text-sm text-gray-500 mb-2">No sections yet</div>}
            {existingSections.map((sec) => (
              <div key={sec.id} className="flex items-center gap-2 mb-2">
                <input name={`section_update_${sec.id}`} defaultValue={sec.name} className="flex-1 border rounded px-2 py-1" />
                <label className="text-sm flex items-center gap-1">
                  <input type="checkbox" name={`section_delete_${sec.id}`} />
                  <p>Delete</p>
                </label>
              </div>
            ))}

            <div className="mt-3">
              <label className="block text-sm mb-1">Add new sections</label>
              {newSections.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input name={`section_new_${idx}`} value={val} onChange={(e) => updateNewSection(idx, e.target.value)} className="flex-1 border rounded px-2 py-1" />
                  <button type="button" onClick={addNewSection} className="px-2 py-1 rounded bg-purple-100 border">+</button>
                  
                  {idx > 0 ? (
                    <button type="button" onClick={() => removeNewSection(idx)} className="px-2 py-1 rounded border">−</button>
                  ) : (
                    <div className='px-2 py-1 rounded border text-gray-400 cursor-not-allowed'>−</div>
                  )}
                </div>
              ))}
            </div>
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
            form='editClassForm'
            disabled={pending}
          >
            {pending ? 'Updating…' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}
