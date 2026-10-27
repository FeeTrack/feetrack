'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Printer } from 'lucide-react';

export default function ViewStudentSlip({ student, onCancel }) {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const slipRef = useRef(null);

//   useEffect(() => {
//     async function fetchSchoolInfo() {
//       const supabase = createClient();
//       const { data, error } = await supabase
//         .from('school_info')
//         .select('name, address, logo_url, phone, email')
//         .single();
//       if (!error && data) setSchoolInfo(data);
//       setLoading(false);
//     }
//     fetchSchoolInfo();
//   }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const fields = [
    { label: 'Admission No.',     value: student.adm_no },
    { label: 'Admission Date',    value: formatDate(student.adm_date) },
    { label: 'Student Name',      value: student.name },
    { label: 'Father\'s Name',    value: student.father_name || '—' },
    { label: 'Mother\'s Name',    value: student.mother_name || '—' },
    { label: 'Parent\'s Mobile',  value: student.parent_mobile || '—' },
    { label: 'Class',             value: student.classes?.name || '—' },
    { label: 'Section',           value: student.sections?.name || '—' },
    { label: 'Roll No.',          value: student.roll_no || '—' },
    { label: 'Transport Route',   value: student.transport_routes?.name || '—' },
  ];

  return (
    <>
      {/* ── Print styles: hide everything except the slip ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #admission-slip, #admission-slip * { visibility: visible !important; }
          #admission-slip {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            padding: 32px 40px !important;
            background: white !important;
            z-index: 9999 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col h-full">

        {/* ── Action bar (hidden on print) ── */}
        <div className="no-print flex justify-end gap-2 mb-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Slip
          </button>
        </div>

        {/* ── The Slip ── */}
        <div
          id="admission-slip"
          ref={slipRef}
          className="bg-white border border-gray-300 rounded-lg overflow-hidden"
        >
          {/* Header */}
          {loading ? (
            <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
              School info here…
            </div>
          ) : (
            <div className="flex items-center gap-4 px-6 py-4 border-b-2 border-gray-800">
              {schoolInfo?.logo_url ? (
                <img
                  src={schoolInfo.logo_url}
                  alt="School Logo"
                  className="w-16 h-16 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                  Logo
                </div>
              )}
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold tracking-wide uppercase text-gray-900">
                  {schoolInfo?.name || 'School Name'}
                </h1>
                {schoolInfo?.address && (
                  <p className="text-xs text-gray-600 mt-0.5">{schoolInfo.address}</p>
                )}
                {(schoolInfo?.phone || schoolInfo?.email) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[schoolInfo.phone, schoolInfo.email].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
              {/* Spacer to keep text centered */}
              <div className="w-16 flex-shrink-0" />
            </div>
          )}

          {/* Slip title + session badge */}
          <div className="flex items-center justify-between px-6 py-2 bg-gray-800 text-white">
            <span className="text-sm font-semibold tracking-widest uppercase">
              Admission Slip
            </span>
            {student.session && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                Session: {
                  typeof student.session === 'object'
                    ? `${student.session.start_year}–${student.session.end_year}`
                    : student.session
                }
              </span>
            )}
          </div>

          {/* Fields grid */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-gray-300 rounded overflow-hidden">
              {fields.map(({ label, value }, i) => (
                <div
                  key={label}
                  className={`flex border-gray-300
                    ${i % 2 === 0 ? 'sm:border-r' : ''}
                    ${i < fields.length - 2 ? 'border-b' : ''}
                    ${i === fields.length - 1 && fields.length % 2 !== 0 ? 'sm:col-span-2' : ''}
                  `}
                >
                  <span className="w-40 flex-shrink-0 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-300">
                    {label}
                  </span>
                  <span className="px-3 py-2.5 text-sm text-gray-900 font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 pt-2 flex justify-between items-end">
            <div className="text-center">
              <div className="w-28 border-t border-gray-500 pt-1 text-xs text-gray-500">
                Principal's Signature
              </div>
            </div>
            <div className="text-xs text-gray-400 italic">
              Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-center">
              <div className="w-28 border-t border-gray-500 pt-1 text-xs text-gray-500">
                Parent's Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}