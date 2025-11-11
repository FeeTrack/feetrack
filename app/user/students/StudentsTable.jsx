'use client'

import { useState } from "react"
import toast from "react-hot-toast"

import Spinner from "@/components/Spinner"
import { UilTrashAlt, UilPen } from '@iconscout/react-unicons'
import ConfirmModal from "@/components/ConfirmModal"

export default function StudentsTable({ students, setStudents, studentsErr, onEdit }) {
    const [openDelete, setOpenDelete] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async (studentId, studentName) => {
        if (!studentId) return
        
        try {
            setOpenDelete(false)
            setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations
            const res = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            
            if (!res.ok) {
                toast.error("Failed to delete student: " + (data.error || res.statusText));
                return;
            }

            // Success
            toast.success(`Successfully Deleted Student: ${studentName}`);
            setStudents(prev => prev.filter(s => s.id !== studentId));
        } catch (error) {
            console.error('Failed to delete student. ' + error)
        } finally {
            setDeleting(false)
        }
    }
    return (
        <div className="bg-white p-4 rounded shadow text-black overflow-x-auto">
            <table className="w-full table-auto">
                <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="p-2">Sr.</th>
                        <th className="p-2">Admission No</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Class</th>
                        <th className="p-2">Section</th>
                        <th className="p-2">Roll No</th>
                        <th className="p-2">parent</th>
                        <th className="p-2">Admission Date</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {studentsErr ? (
                        <tr><td colSpan={9} className="text-sm text-center text-red-900 bg-red-50 px-3 py-2 rounded">
                            Failed to load students. {studentsErr.message}
                        </td></tr>
                    ) : !students || students.length === 0 ? (
                        <tr><td colSpan={9} className="text-sm text-center text-gray-500 px-3 py-2">
                            No students yet.
                        </td></tr>
                    ) : (
                        students.map((s, index) => (
                            <tr key={s.id} className="border-b">
                                <td className="py-2">{index + 1}</td>
                                <td className="py-2">{s.adm_no}</td>
                                <td className="py-2">{s.name}</td>
                                <td className="py-2">{s.classes.name || '-'}</td>
                                <td className="py-2">{s.sections.name || '-'}</td>
                                <td className="py-2">{s.roll_no || '-'}</td>
                                <td className="py-2">{s.parent_mobile || '-'}</td>
                                <td className="py-2">{new Date(s.adm_date).toLocaleDateString() || '-'}</td>
                                <td className="p-2 text-white w-full flex items-center gap-2">
                                    <button onClick={() => onEdit(s)} className="bg-blue-600 p-1 rounded cursor-pointer">
                                        <UilPen size='16' color='white' />
                                    </button>
                                    <button onClick={() => {setSelectedStudent(s); setOpenDelete(true);}} className="bg-red-600 p-1 rounded cursor-pointer">
                                        <UilTrashAlt size='16' color='white' />
                                    </button>
                                    {selectedStudent && (
                                        <ConfirmModal 
                                            isOpen={openDelete}
                                            onClose={() => setOpenDelete(false)}
                                            onConfirm={() => handleDelete(selectedStudent.id, selectedStudent.name)}
                                            action="Delete"
                                            message={
                                            <>
                                                Are you sure you want to <strong>delete</strong> the student "<strong>{selectedStudent.name}</strong>"? This action cannot be undone.
                                            </>
                                            }
                                        />
                                    )}

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