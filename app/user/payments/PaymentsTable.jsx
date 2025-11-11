// PaymentsTable.jsx
'use client';
import toast from "react-hot-toast";
import { useState } from "react";
import { UilPen, UilEye, UilTrashAlt } from '@iconscout/react-unicons'

import Spinner from "@/components/Spinner";
import ConfirmModal from "@/components/ConfirmModal";

export default function PaymentsTable({ payments = [], setPayments, paymentsErr, onEdit }) {
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (paymentId, receiptNo) => {
        if (!paymentId) return;

        try {
            setOpenDelete(false);
            setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations

            const res = await fetch(`/api/payments/${paymentId}`, {method: 'DELETE'});
            const data = await res.json();

            if (!res.ok) {
                toast.error("Failed to delete payment: " + (data.error || res.statusText));
                return;
            }

            setPayments(prev => prev.filter(p => p.id !== paymentId));
            toast.success(`Successfully Deleted Payment: ${receiptNo}`);
        } catch (error) {
            console.error("Error deleting payment: " + error);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="bg-white p-4 rounded shadow text-black overflow-x-auto">
            <table className="w-full table-auto">
                <thead>
                    <tr className="text-left text-gray-600 text-sm border-b">
                        <th className="py-2">Sr.</th>
                        <th className="py-2">Receipt No.</th>
                        <th className="py-2">Student</th>
                        <th className="py-2">Class</th>
                        <th className="py-2">Adm No.</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paymentsErr ? (
                        <tr>
                            <td colSpan={8} className="text-sm text-center text-red-900 bg-red-50 px-3 py-2 rounded">
                                Failed to load payments. {paymentsErr.message}
                            </td>
                        </tr>
                    ) : payments.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="py-4 text-center text-gray-500">No payments yet.</td>
                        </tr>
                    ) : (
                        payments.map((p, index) => (
                            <tr key={p.id} className="border-b">
                                <td className="py-2">{index + 1}</td>
                                <td className="py-2">{p.receipt_no}</td>
                                <td className="py-2">{p.students.name}</td>
                                <td className="py-2">{`${p.students.classes.name}-${p.students.sections.name}`}</td>
                                <td className="py-2">{p.students.adm_no}</td>
                                <td className="py-2">{p.amount}</td>
                                <td className="py-2">{new Date(p.created_at).toLocaleDateString('en-IN').split('T')[0]}</td>
                                <td className="p-2 text-white">
                                    <div className="flex items-center gap-2">
                                        {/* Payments Edit Button */}
                                        <button onClick={() => onEdit(p)} className="bg-blue-600 p-1 rounded cursor-pointer">
                                            <UilPen size='16' color='white' />
                                        </button>
                                        {/* Payments View Button */}
                                        <button className="bg-amber-500 p-1 rounded cursor-pointer">
                                            <UilEye size='16' color='white' />
                                        </button>
                                        {/* Payments Delete Button */}
                                        <button onClick={() => {setSelectedPayment(p); setOpenDelete(true);}} className="bg-red-600 p-1 rounded cursor-pointer">
                                            <UilTrashAlt size='16' color='white' />
                                        </button>
                                        {selectedPayment && (
                                            <ConfirmModal 
                                                isOpen={openDelete}
                                                onClose={() => setOpenDelete(false)}
                                                onConfirm={() => handleDelete(selectedPayment.id, selectedPayment.receipt_no)}
                                                action="Delete"
                                                message={
                                                <>
                                                    Are you sure you want to <strong>delete</strong> the payment with receipt no. "<strong>{selectedPayment.receipt_no}</strong>"? This action cannot be undone.
                                                </>
                                                }
                                            />
                                        )}
                                        {deleting && (
                                            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                                                <Spinner size={28} />
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
