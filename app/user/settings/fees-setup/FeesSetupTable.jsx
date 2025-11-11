'use client';
import { useState } from "react";
import { UilTrashAlt } from '@iconscout/react-unicons'
import { UilPen } from '@iconscout/react-unicons'
import toast from "react-hot-toast";

import Spinner from "@/components/Spinner";
import ConfirmModal from "@/components/ConfirmModal";

export default function FeesSetupTable({ feeHeads = [], onEdit, setFeeHeads }) {
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedFeeHead, setSelectedFeeHead] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (feeHeadID, feeHeadName) => {
        if (!feeHeadID) return;

        try {
            setOpenDelete(false);
            setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations
            const res = await fetch(`/api/fees/setup/${feeHeadID}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error("Failed to delete fee structure. " + data.error);
                return;
            }
            
            // success
            toast.success(`Successfully Deleted Fee Structure: ${feeHeadName}`);
            setFeeHeads(prev => prev.filter(f => f.id !== feeHeadID));
        } catch (error) {
            console.error("Error deleting fee structure:" + error)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="bg-white p-4 rounded shadow text-black overflow-x-auto">
            <table className="w-full table-auto">
                <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="py-2">Sr.</th>
                        <th className="py-2">Fee Type</th>
                        <th className="py-2">Class Wise Amount</th>
                        <th className="py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {feeHeads.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center py-4 text-gray-500">No fee structures found.</td>
                        </tr>
                    ) : (
                        feeHeads.map((fee, index) => (
                            <tr key={fee.id} className="border-b">
                                <td className="py-2">{index + 1}</td>
                                <td className="py-2">{fee.name}</td>
                                <td>
                                    <div className="py-2 flex flex-wrap gap-2">
                                        {fee.fee_structures.map((fs) => (
                                            <div key={fs.id} className="flex items-center justify-center gap-1 max-w-fit p-1 bg-gray-500 text-white rounded">
                                                <span>{fs.classes.name}:</span>
                                                <span>{fs.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-2 text-white">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEdit(fee)} className="bg-blue-600 p-1 rounded cursor-pointer">
                                            <UilPen size='16' color='white' />
                                        </button>

                                        <button onClick={() => { setSelectedFeeHead(fee); setOpenDelete(true); }} className="bg-red-600 p-1 rounded cursor-pointer">
                                            <UilTrashAlt size='16' color='white' />
                                        </button>
                                        {selectedFeeHead && (
                                            <ConfirmModal
                                                isOpen={openDelete}
                                                onClose={() => setOpenDelete(false)}
                                                onConfirm={() => handleDelete(selectedFeeHead.id, selectedFeeHead.name)}
                                                action="Delete"
                                                message={
                                                    <>
                                                        Are you sure you want to <strong>delete</strong> the fee structure "<strong>{selectedFeeHead.name}</strong>"? This action cannot be undone.
                                                    </>
                                                }
                                            />
                                        )}

                                    </div>
                                    {deleting && (
                                        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                                            <Spinner size={28} />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}