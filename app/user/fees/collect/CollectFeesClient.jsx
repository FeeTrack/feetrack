'use client';
import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import toast from 'react-hot-toast';

import { searchStudentAction } from './actions';
import CollectFeesForm from './CollectFeesForm';
import Modal from '@/components/Modal';
import Spinner from '@/components/Spinner';
import { months } from '@/utils/constants/backend';

export default function CollectFeesClient() {
    const [state, formAction, pending] = useActionState(searchStudentAction);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const students = state?.student ? [state.student] : state?.students ? state.students : [];
    
    const [formData, setFormData] = useState({
        admNoQuery: '',
        nameQuery: ''
    })
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    useEffect(() => {
        setFormData(prev => ({...prev}));
        if (state?.error) {
            toast.error(state?.error);
        } 
    }, [state]);

    const handleCancel  = () => {
        setOpen(false)
        setSelectedStudent(null)
        setTotalFeesAmount(null);
        setTotalPaid(null)
        setTotalFine(null)
        setTotalDiscount(null)
    }

    const [payPeriods, setPayPeriods] = useState([]);
    const [invoiceItems, setInvoiceItems] = useState([]);

    const [totalFeesAmount, setTotalFeesAmount] = useState(null);
    const [totalFine, setTotalFine] = useState(null);
    const [totalPaid, setTotalPaid] = useState(null);
    const [totalDiscount, setTotalDiscount] = useState(null);

    useEffect(() => {
        if (!selectedStudent) return;
        const fetchInvoicePeriodsItems = async () => {
            setLoading(true);
            const res = await fetch(`/api/fees/collect/invoices?student_id=${selectedStudent?.id}&session_id=${selectedStudent?.academic_sessions?.id}`, {
                method: 'GET'
            });

            if (!res.ok) {
                const errorData = await res.json();
                toast.error((errorData?.error || res.statusText));
                setLoading(false);
                return;
            }

            const data = await res.json();

            const invoices = data?.invoices ?? [];
            const totalDiscounts = data?.totalDiscounts ?? [];
            const invoiceItems = data?.invoiceItems ?? [];

            const tfa = invoices.reduce((acc, invoice) => acc + Number(invoice.amount), 0);
            
            const lateFeeItems = invoiceItems.filter(item => item.is_late_fee);
            const tf = lateFeeItems.reduce((acc, item) => acc + Number(item.amount), 0);
            setTotalFine(tf);
            setTotalFeesAmount(tfa - tf);

            const tp = invoices.reduce((acc, invoice) => acc + Number(invoice.amount_paid), 0);
            setTotalPaid(tp);

            if (totalDiscounts.length === 0) {
                setTotalDiscount(0);
            } else {
                const td = await totalDiscounts.reduce((acc, td) => acc + Number(td.amount), 0);
                setTotalDiscount(td);
            }

            const allMonths = months.map(month => month.name);

            const sortedInvoices = invoices.sort((a, b) => {
                const monthA = a.pay_period.split('-')[0];
                const monthB = b.pay_period.split('-')[0];
                return allMonths.indexOf(monthA) - allMonths.indexOf(monthB);
            });

            const periods = sortedInvoices.map(inv => ({
                value: inv.pay_period,
                label: inv.status === 'paid' ? `${inv.pay_period.split('-')[0]} (Paid)` : inv.pay_period.split('-')[0],
                isDisabled: inv.status === 'paid' ? true : false,
                invoiceId: inv.id
            }))

            setPayPeriods(periods);
            setInvoiceItems(invoiceItems);
            setLoading(false);
        }
        fetchInvoicePeriodsItems();
    }, [selectedStudent])

  return (
    <div className='px-2'>
        <form action={formAction} id='collectFeesForm'>
            <div className='w-full flex items-center justify-start gap-4 md:gap-8'>
                <div className='w-full flex md:max-w-fit md:flex-row flex-col md:items-center items-start gap-4 md:gap-8'>
                    <div className='flex w-full flex-row md:flex-col items-center justify-between md:items-start gap-2'>
                        <label className='mb-1 font-semibold '>Search by Admission No.</label>
                        <input 
                            type='number'
                            name='admNoQuery'
                            value={formData.admNoQuery}
                            onChange={handleChange}
                            disabled={formData.nameQuery.trim() !== ''}
                            className="border rounded-2xl px-2 py-1"
                        />
                    </div>
                    <p className='text-center w-full md:max-w-fit'>Or</p>
                    <div className='flex w-full md:max-w-fit flex-row md:flex-col items-center justify-between md:items-start gap-2'>
                        <label className='mb-1 font-semibold'>Search by Name</label>
                        <input 
                            type='text'
                            name='nameQuery'
                            value={formData.nameQuery}
                            onChange={handleChange}
                            disabled={formData.admNoQuery.trim() !== ''}
                            className="border rounded-2xl px-2 py-1"
                        />
                    </div>
                </div>

                <button type="submit" className="primary-btn ml-2" form='collectFeesForm' disabled={!formData.admNoQuery.trim() && !formData.nameQuery.trim()}>Search</button>
            </div>
        </form>

        {pending && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                <Spinner size={28} />
            </div>
        )}

        <div className='mt-6 w-full '>
            <div className="w-full max-w-3xl">
                {students.map(s => (
                <div key={s.id} className="flex items-center justify-between text-gray-600 p-2 bg-[#f0f0f0] border border-[#f0f0f0] rounded-md mb-4">
                    <div className='flex flex-col gap-2'>
                        <h1 className='font-bold'>{s.name}</h1>

                        <div className='flex items-center gap-2 text-gray-600'>
                            <div><span className='font-semibold'>Admission No:</span> {s.adm_no}</div>
                            <div><span className='font-semibold'>Class & Sec:</span> {s.classes.name}-{s.sections.name}</div>
                            <div><span className='font-semibold'>Roll No:</span> {s.roll_no}</div>
                        </div>
                    </div>
                    <div>
                        <button
                            className="primary-btn md:mr-2"
                            onClick={() => { setSelectedStudent(s); setOpen(true); }}
                        >
                            Collect Fee
                        </button>
                    </div>
                </div>
                ))}
            </div>
        </div>

        {loading && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                <Spinner size={28} />
            </div>
        )}

        {selectedStudent && totalFeesAmount && (
            <Modal open={open} onClose={() => setOpen(false)} title="Collect Fees">
                <CollectFeesForm 
                    student={selectedStudent}
                    onCancel={handleCancel}
                    payPeriods={payPeriods}
                    invoiceItems={invoiceItems}
                    totalFeesAmount={totalFeesAmount}
                    totalFine={totalFine}
                    totalPaid={totalPaid}
                    totalDiscount={totalDiscount}
                />
            </Modal>
        )}
    </div>
  );
}