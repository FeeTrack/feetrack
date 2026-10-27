'use client';

import DateInput from '@/components/DateInput';
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { addStaffAction, updateStaffAction } from './actions';
import { genders } from '@/utils/constants/students';
import { Field, Section, inputClass } from '@/components/FormParts';
import PhotoUpload from '@/components/PhotoUpload';

export default function StaffForm({ mode, staff, photoUrl }) {
  const isEdit = mode === 'edit';
  const router = useRouter();
  const [state, formAction, pending] = useActionState(isEdit ? updateStaffAction : addStaffAction, { error: null });

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: staff?.name ?? '',
    gender: staff?.gender ?? '',
    dob: staff?.dob ?? '',
    aadhaar_no: staff?.aadhaar_no ?? '',
    qualification: staff?.qualification ?? '',
    mobile_no: staff?.mobile_no ?? '',
    email: staff?.email ?? '',
    address: staff?.address ?? '',
    designation: staff?.designation ?? '',
    joining_date: staff?.joining_date ?? today,
    salary: staff?.salary ?? '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [photo, setPhoto] = useState({ file: null, removed: false });
  const [processingPhoto, setProcessingPhoto] = useState(false);

  const handleSubmit = (fd) => {
    if (photo.file) fd.set('photo', photo.file);
    if (isEdit && photo.removed) fd.set('remove_photo', 'true');
    formAction(fd);
  };

  useEffect(() => {
    if (state?.status === 'success') {
      toast.success(state.message);
      if (state.warning) toast.error(state.warning);
      router.push(`/user/staff/${state.staff.id}/details`);
    } else if (state?.error) {
      toast.error(state.error.message || state.error);
    }
  }, [state]);

  return (
    <form action={handleSubmit} className="space-y-5 max-w-5xl">
      {isEdit && <input type="hidden" name="staff_id" value={staff.id} />}

      <Section title="Personal Details">
        <div className="flex flex-col md:flex-row gap-6">
          <PhotoUpload initialUrl={photoUrl} onChange={setPhoto} onBusyChange={setProcessingPhoto} />

          <div className="flex-1 grid gap-4 sm:grid-cols-2">
            <Field label="Staff Name" required className="sm:col-span-2">
              <input name="name" required value={formData.name} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="Gender" required>
              <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="">Select Gender</option>
                {genders.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>

            <Field label="Date of Birth">
              <DateInput name="dob" max={today} value={formData.dob} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="Aadhaar No.">
              <input name="aadhaar_no" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} title="12-digit Aadhaar number" value={formData.aadhaar_no} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="Qualification">
              <input name="qualification" placeholder="e.g. M.Sc., B.Ed." value={formData.qualification} onChange={handleChange} className={inputClass} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Contact Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile No.">
            <input name="mobile_no" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="10-digit mobile number" value={formData.mobile_no} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Email">
            <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Address" className="sm:col-span-2">
            <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Employment Details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Designation" required>
            <input name="designation" required placeholder="e.g. Teacher, Driver" value={formData.designation} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Joining Date" required>
            <DateInput name="joining_date" required value={formData.joining_date} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Monthly Salary">
            <input name="salary" type="number" min="0" value={formData.salary} onChange={handleChange} className={inputClass} />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-3 pb-4">
        <button type="button" onClick={() => router.back()} className="primary-btn bg-gray-200 hover:bg-gray-300 text-black px-4 py-2">
          Cancel
        </button>
        <button type="submit" disabled={pending || processingPhoto} className="primary-btn px-4 py-2 disabled:opacity-60">
          {pending ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Staff')}
        </button>
      </div>
    </form>
  );
}
