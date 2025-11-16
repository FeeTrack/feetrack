'use client';
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import Modal from '@/components/Modal';
import CreateClassForm from './CreateClassForm';
import EditClassForm from './EditClassForm';
import ConfirmModal from '@/components/ConfirmModal';
import Spinner from '@/components/Spinner';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Trash2 } from "lucide-react";

export default function ClassesClient({ classes: initial }) {
  const [classes, setClasses] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editClass, setEditClass] = useState(null);

  useEffect(() => {
    setClasses(initial);
  }, [initial]);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!searchQuery) {
      setClasses(initial);
    } else {
      setClasses(initial.filter(cls => cls.name.toLowerCase().includes(searchQuery.toLowerCase())));
    }
  }, [searchQuery]);

  const modalRef = useRef();
  const scrollModalTop = () => {
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const handleSubmit = (state) => {
    scrollModalTop()
    setShowEdit(false)
    setEditClass(null)
    if (state?.status === 'success') {
      toast.success(state.message);
      return;
    }
    if (state?.error) {
      toast.error(state?.error);
    }
  }

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteClass, setDeleteClass] = useState(null);
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
    <div className="space-y-6">
      <div className='w-full flex items-center gap-4 flex-wrap'>
        <button className="primary-btn" onClick={() => setShowAdd(true)}>
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Class
          </span>
        </button>
      </div>

      <div className='w-full flex flex-col'>
        {classes ? (
          <>
            <Card className='w-full max-w-[calc(100vw-48px)] overflow-x-auto'>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="relative flex-initial">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search in the table"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-8 w-full max-w-64 text-sm'
                    />
                  </div>
                  <Button variant='outline' size='icon'>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sr.</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Sections</TableHead>
                        <TableHead className='text-right pr-4'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No classes yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        classes.map((cls, index) => (
                          <TableRow key={cls.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{cls.name}</TableCell>
                            <TableCell>
                              {Array.isArray(cls.sections) && cls.sections.length > 0 ? cls.sections.map(s => s.name).join(', ') : ''}
                            </TableCell>
                            <TableCell className='text-right pr-4'>
                              <div className="flex justify-end gap-2">
                                <button className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200' onClick={() => {setEditClass(cls); setShowEdit(true);}}>
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className='p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200' onClick={() => {setDeleteClass(cls); setOpenDelete(true)}}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          null
        )}
      </div>

      {deleteClass && (
        <ConfirmModal
          isOpen={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={() => handleDelete(deleteClass.id, deleteClass.name)}
          action="Delete"
            message={
            <>Are you sure you want to delete the class "<strong>{deleteClass.name}</strong>"? This action cannot be undone.</>
            }
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      )}
      
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Class" ref={modalRef}>
        <CreateClassForm 
          onSubmit={handleSubmit}
          onCancel={() => setShowAdd(false)} 
        />
      </Modal>

      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditClass(null); }} title="Edit Class">
        {editClass && (
          <EditClassForm 
            classObj={editClass}
            onSubmit={handleSubmit}
            onCancel={() => { setShowEdit(false); setEditClass(null); }} />
          )}
      </Modal>
    </div>
  );
}
