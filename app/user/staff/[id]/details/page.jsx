import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Edit, User } from 'lucide-react';
import { getUser, checkFeatureAccess } from '@/utils/supabase/supabaseQueries';
import { createServerSupabase } from '@/utils/supabase/server';
import { getSignedPhotoUrl } from '@/utils/photos';
import { genders } from '@/utils/constants/students';

import UserLayout from '../../../UserLayout';
import PrintButton from '@/components/PrintButton';
import { FieldGrid, SectionTitle } from '@/components/PrintFields';

export const metadata = {
  title: 'Staff Details | FeeTrack',
  description: 'Printable staff details form.'
}

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  : null;

const formatAadhaar = (no) => no ? no.replace(/(\d{4})(?=\d)/g, '$1 ') : null;

export default async function StaffDetailsPage({ params }) {
  const { id } = await params;

  const profile = await getUser();
  if (!profile) {
    redirect('/login');
  }

  const accessCheck = await checkFeatureAccess(profile.school_id, 'staffModule');
  if (!accessCheck.allowed) {
    redirect('/user/staff');
  }

  const supabase = await createServerSupabase();
  const [{ data: staff }, { data: school }] = await Promise.all([
    supabase.from('staff').select('*').eq('id', id).eq('school_id', profile.school_id).maybeSingle(),
    supabase.from('schools').select('name, address').eq('id', profile.school_id).single(),
  ]);

  if (!staff) {
    notFound();
  }

  const photoUrl = await getSignedPhotoUrl(staff.photo_path);

  // Same arrangement as the staff form: basic and personal details beside the photo, contact below
  const personalFields = [
    { label: 'Staff Name', value: staff.name, full: true },
    { label: 'Designation', value: staff.designation },
    { label: 'Gender', value: genders.find(g => g.value === staff.gender)?.label },
    { label: 'Joining Date', value: formatDate(staff.joining_date) },
    { label: 'Date of Birth', value: formatDate(staff.dob) },
    { label: 'Aadhaar No.', value: formatAadhaar(staff.aadhaar_no) },
    { label: 'Qualification', value: staff.qualification },
  ];

  const contactFields = [
    { label: 'Mobile No.', value: staff.mobile_no },
    { label: 'Email', value: staff.email },
    { label: 'Address', value: staff.address, full: true },
  ];

  return (
    <UserLayout pageName='Staff Details'>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      `}</style>

      <div className="max-w-[210mm] mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href='/user/staff' className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> Back to Staff
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/user/staff/${staff.id}/edit`} className="primary-btn px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black">
              <span className="flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</span>
            </Link>
            <PrintButton />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-10 print:p-0 print:border-0 print:shadow-none print:rounded-none print:flex print:flex-col print:min-h-[265mm]">
          {/* School header */}
          <header className="text-center pb-4 border-b-4 border-double border-primary">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-gray-900">{school?.name}</h1>
            {school?.address && <p className="mt-1 text-sm font-medium text-gray-600">{school.address}</p>}
          </header>

          <div className="mt-5 mb-5">
            <span className="rounded-md bg-primary px-4 py-1.5 text-sm font-bold uppercase tracking-[0.2em] text-white">Staff Details</span>
          </div>

          {/* Basic & personal details beside the photo */}
          <section className="mb-6">
            <SectionTitle>Basic &amp; Personal Details</SectionTitle>
            <div className="flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <FieldGrid fields={personalFields} />
              </div>
              <div className="w-[30mm] h-[40mm] shrink-0 border-2 border-gray-400 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <User className="w-8 h-8" />
                    <span className="text-[10px] mt-1">Affix Photo</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mb-6">
            <SectionTitle>Contact Details</SectionTitle>
            <FieldGrid fields={contactFields} />
          </section>

          {/* Signatures */}
          {/* On paper, pushed to the bottom of the A4 page */}
          <div className="flex justify-between items-end mt-20 print:mt-auto print:pt-16">
            <div className="w-48 border-t-2 border-gray-700 pt-1 text-center text-sm font-semibold text-gray-800">Staff Signature</div>
            <div className="w-48 border-t-2 border-gray-700 pt-1 text-center text-sm font-semibold text-gray-800">Principal&apos;s Signature</div>
          </div>

          <p className="mt-8 text-center text-[11px] text-gray-400">
            Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </UserLayout>
  );
}
