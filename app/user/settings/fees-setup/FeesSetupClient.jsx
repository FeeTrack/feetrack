'use client';
import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

import CreateFeeForm from './CreateFeeForm';
import EditFeeForm from './EditFeeForm';
import ConfirmModal from '@/components/ConfirmModal';
import Spinner from '@/components/Spinner';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Trash2 } from "lucide-react";

export default function FeesSetupClient({ feeHeads: initial, classes: cls = [] }) {
  const [feeHeads, setFeeHeads] = useState(initial);
  const [classes, setClasses] = useState(cls);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editFeeHead, setEditFeeHead] = useState(null);

  useEffect(() => {
    setFeeHeads(initial);
    setClasses(cls);
  }, [initial, cls]);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
      if (searchQuery.trim() === '') {
          setFeeHeads(initial);
      } else {
          const filtered = initial.filter((fee) =>
              fee.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          setFeeHeads(filtered);
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
    setEditFeeHead(null)
    if (state?.status === 'success') {
      toast.success(state.message);
      return;
    }
    if (state?.error) {
      toast.error(state?.error);
    }
  }

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteFeeHead, setDeleteFeeHead] = useState(null);
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
    <div className="space-y-6">
      <div className='w-full flex items-center gap-4 flex-wrap'>
        <button className="primary-btn" onClick={() => setShowAdd(true)}>
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Fee
          </span>
        </button>
      </div>

      <div className='w-full flex flex-col'>
        {feeHeads ? (
          <>
            <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto'>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search fee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-full max-w-64 text-sm"
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
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Class Wise Amount</TableHead>
                        <TableHead className="text-right pr-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeHeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No fee structures found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        feeHeads.map((fee, index) => (
                          <TableRow key={fee.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{fee.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {fee.fee_structures.map((fs) => (
                                    <div key={fs.id} className="flex items-center justify-center gap-1 max-w-fit p-1 bg-secondary text-white rounded">
                                        <span>{fs.classes.name}:</span>
                                        <span>{fs.amount}</span>
                                    </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <div className="flex justify-end gap-2">
                                <button className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200' onClick={() => {setEditFeeHead(fee); setShowEdit(true);}}>
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className='p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200' onClick={() => {setDeleteFeeHead(fee); setOpenDelete(true)}}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
      
      {deleteFeeHead && (
        <ConfirmModal
          isOpen={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={() => handleDelete(deleteFeeHead.id, deleteFeeHead.name)}
          action="Delete"
            message={
            <>
              Are you sure you want to delete the fee "<strong>{deleteFeeHead.name}</strong>"? This action cannot be undone.
            </>
            }
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Fee" ref={modalRef}>
        <CreateFeeForm
          onSubmit={handleSubmit}
          onCancel={() => setShowAdd(false)}
          classes={classes}
        />
      </Modal>

      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditFeeHead(null); }} title="Edit Fee">
        {editFeeHead && (
          <EditFeeForm 
            fee={editFeeHead}
            classes={classes}
            onSubmit={handleSubmit}
            onCancel={() => { setShowEdit(false); setEditFeeHead(null); }} />
          )}
      </Modal>
    </div>
  );
}
