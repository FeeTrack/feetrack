'use client';
import { useState } from "react";
import { UilTrashAlt } from '@iconscout/react-unicons'
import { UilPen } from '@iconscout/react-unicons'
import toast from "react-hot-toast";

import Spinner from "@/components/Spinner";
import ConfirmModal from "@/components/ConfirmModal";

export default function ClassesTable({ classes = [], onEdit, setClasses }) {
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (classId, className) => {
    if (!classId) return;

    try {
      setOpenDelete(false);
      setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
  
      if (!res.ok) {
        toast.error("Failed to delete class: " + (data.error || res.statusText));
        return;
      }
      // Success
      toast.success(`Successfully Deleted Class: ${className}`);
      setClasses(prev => prev.filter(c => c.id !== classId));
    } catch (error) {
      console.error("Error deleting class:" + error)
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow text-black overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left text-sm text-gray-600 border-b">
            <th className="py-2">Sr.</th>
            <th className="py-2">Class</th>
            <th className="py-2">Sections</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.length === 0 ? (
            <tr><td colSpan="4" className="py-4 text-center text-gray-500">No classes yet.</td></tr>
          ) : classes.map((c, index) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{c.name}</td>
              <td className="p-2">
                {Array.isArray(c.sections) && c.sections.length > 0 ? c.sections.map(s => s.name).join(', ') : ''}
              </td>              
              <td className="p-2 text-white w-full flex items-center gap-2">
                <button onClick={() => onEdit(c)} className="bg-blue-600 p-1 rounded cursor-pointer">
                    <UilPen size='16' color='white' />
                </button>
                <button onClick={() => {setSelectedClass(c); setOpenDelete(true);}} className="bg-red-600 p-1 rounded cursor-pointer">
                    <UilTrashAlt size='16' color='white' />
                </button>
                {selectedClass && (
                  <ConfirmModal 
                    isOpen={openDelete}
                    onClose={() => setOpenDelete(false)}
                    onConfirm={() => handleDelete(selectedClass.id, selectedClass.name)}
                    action="Delete"
                    message={
                      <>
                          Are you sure you want to <strong>delete</strong> the class "<strong>{selectedClass.name}</strong>"? This action cannot be undone.
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
          ))}
        </tbody>
      </table>
    </div>
  );
}