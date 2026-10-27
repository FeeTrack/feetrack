'use client';

import DateInput from '@/components/DateInput';
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Select from 'react-select';

import { createStudentAction, updateStudentAction } from './all-students/actions';
import { genders, categories, bloodGroups } from '@/utils/constants/students';
import { Field, Section, inputClass } from '@/components/FormParts';
import PhotoUpload from '@/components/PhotoUpload';

export default function StudentForm({ mode, student, photoUrl, classes, sections, transportRoutes, admNo, schoolType }) {
  const isEdit = mode === 'edit';
  const router = useRouter();
  const [state, formAction, pending] = useActionState(isEdit ? updateStudentAction : createStudentAction, { error: null });

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: student?.name ?? '',
    gender: student?.gender ?? '',
    dob: student?.dob ?? '',
    blood_group: student?.blood_group ?? '',
    category: student?.category ?? '',
    aadhaar_no: student?.aadhaar_no ?? '',
    apaar_id: student?.apaar_id ?? '',
    father_name: student?.father_name ?? '',
    mother_name: student?.mother_name ?? '',
    parent_mobile: student?.parent_mobile ?? '',
    address: student?.address ?? '',
    class: student?.class_id ?? '',
    section: student?.section_id ?? '',
    sr_no: student?.sr_no ?? '',
    adm_date: student?.adm_date ?? today,
    roll_no: student?.roll_no ?? '',
    availTransport: Boolean(student?.route_id),
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClassChange = (e) => {
    setFormData(prev => ({ ...prev, class: e.target.value, section: '' }));
  };

  const filteredSections = sections.filter(s => s.class_id === formData.class);

  // Transport
  const routeOptions = transportRoutes.map(route => ({ label: route.name, value: route.id }));
  const [selectedRoute, setSelectedRoute] = useState(
    routeOptions.find(r => r.value === student?.route_id) || null
  );
  const routeFee = transportRoutes.find(route => route.id === selectedRoute?.value)?.monthly_fee || null;

  // Photo: compressed in the browser by PhotoUpload, then attached to the form data on submit
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
      if (isEdit) {
        router.push('/user/students/all-students');
      } else {
        router.push(`/user/students/${state.student.id}/admission-form`);
      }
    } else if (state?.error) {
      toast.error(state.error.message || state.error);
    }
  }, [state]);

  return (
    <form action={handleSubmit} className="space-y-5 max-w-5xl">
      {isEdit && <input type="hidden" name="studentId" value={student.id} />}

      {/* Student Details */}
      <Section title="Student Details">
        <div className="flex flex-col md:flex-row gap-6">
          <PhotoUpload initialUrl={photoUrl} onChange={setPhoto} onBusyChange={setProcessingPhoto} />

          <div className="flex-1 grid gap-4 sm:grid-cols-2">
            <Field label="Student Name" required className="sm:col-span-2">
              <input name="name" required value={formData.name} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="Gender" required>
              <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="">Select Gender</option>
                {genders.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>

            <Field label="Date of Birth" required>
              <DateInput name="dob" required max={today} value={formData.dob} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="Blood Group">
              <select name="blood_group" value={formData.blood_group} onChange={handleChange} className={inputClass}>
                <option value="">Select Blood Group</option>
                {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            <Field label="Category">
              <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Aadhaar No.">
              <input name="aadhaar_no" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} title="12-digit Aadhaar number" value={formData.aadhaar_no} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="APAAR ID">
              <input name="apaar_id" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} title="12-digit APAAR ID" value={formData.apaar_id} onChange={handleChange} className={inputClass} />
            </Field>
          </div>
        </div>
      </Section>

      {/* Parent Details & Address */}
      <Section title="Parent Details & Address">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Father's Name">
            <input name="father_name" value={formData.father_name} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Mother's Name">
            <input name="mother_name" value={formData.mother_name} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Parent's Mobile" required>
            <input name="parent_mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="10-digit mobile number" required value={formData.parent_mobile} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Address" required className="sm:col-span-2 lg:col-span-3">
            <textarea name="address" required rows={2} value={formData.address} onChange={handleChange} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* Admission Details */}
      <Section title="Admission Details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Class" required>
            <select name="class" required value={formData.class} onChange={handleClassChange} className={inputClass}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Section" required>
            <select name="section" required disabled={!formData.class} value={formData.section} onChange={handleChange} className={inputClass}>
              <option value="">Select Section</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>

          <Field label="Roll No.">
            <input name="roll_no" type="number" value={formData.roll_no} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Admission No.">
            <input name="adm_no" readOnly value={isEdit ? student.adm_no : admNo} className={inputClass} />
          </Field>

          <Field label="SR No.">
            <input name="sr_no" value={formData.sr_no} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="Admission Date" required>
            <DateInput name="adm_date" required value={formData.adm_date} onChange={handleChange} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* Transport & Fees */}
      <Section title={isEdit ? 'Transport' : 'Transport & Fees'}>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 w-fit cursor-pointer">
            <input
              type="checkbox"
              checked={formData.availTransport}
              onChange={(e) => { setFormData(prev => ({ ...prev, availTransport: e.target.checked })); setSelectedRoute(null); }}
            />
            Avail Transport
          </label>

          {formData.availTransport && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Transport Route">
                <Select
                  instanceId="transport-route-select"
                  options={routeOptions}
                  value={selectedRoute}
                  onChange={setSelectedRoute}
                  placeholder="Select Route"
                  isClearable
                />
                <input type="hidden" name="routeId" value={selectedRoute?.value || ''} />
              </Field>

              {routeFee && (
                <Field label="Route's Monthly Fee">
                  <input disabled value={routeFee} className={inputClass} />
                </Field>
              )}
            </div>
          )}
          {isEdit && (
            <p className="text-xs text-gray-500">After changing the route, use &quot;Update Fee Structure&quot; from the students list to update this student&apos;s fees.</p>
          )}

          {!isEdit && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm pt-2 border-t border-gray-100">
                <div>
                  <p className="font-semibold text-gray-700">Apply Monthly Fees From</p>
                  <p className="text-xs text-gray-500">(Date from which monthly fees is applied to the student)</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="month_fee_from" value="session_start" defaultChecked={schoolType !== 'tuition'} />
                    Session Start
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="month_fee_from" value="adm_date" defaultChecked={schoolType === 'tuition'} />
                    Admission Date
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 w-fit cursor-pointer">
                <input type="checkbox" name="gen_fee" />
                Generate Fee Based on Class
              </label>
            </>
          )}
        </div>
      </Section>

      <div className="flex justify-end gap-3 pb-4">
        <button type="button" onClick={() => router.back()} className="primary-btn bg-gray-200 hover:bg-gray-300 text-black px-4 py-2">
          Cancel
        </button>
        <button type="submit" disabled={pending || processingPhoto} className="primary-btn px-4 py-2 disabled:opacity-60">
          {pending ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Student')}
        </button>
      </div>
    </form>
  );
}
