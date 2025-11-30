'use client';
import React, { useState, useEffect, useRef } from 'react';
import toast from "react-hot-toast";

import { createClientSupabase } from '@/utils/supabase/client';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import AddExpenseHeadForm from './AddExpenseHeadForm';
import EditExpenseHeadForm from './EditExpenseHeadForm';
import Spinner from '@/components/Spinner';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Trash2, ArrowLeft, ArrowRight } from "lucide-react";

export default function ExpenseSetupClient({profile, expenseHeads: inital}) {
  const [expenseHeads, setExpenseHeads] = useState(inital);
  const [editExpenseHead, setEditExpenseHead] = useState(null);

  useEffect(() => {
    setExpenseHeads(inital)
  }, [inital]);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [pageNo, setPageNo] = useState(1);
  const pageSize = 10;
  const count = expenseHeads.length || 0;
  const totalPages = Math.ceil(count/pageSize)

  const expenseHeadsToDisplay = expenseHeads.slice(
    (pageNo - 1) * pageSize, pageNo * pageSize
  )

  useEffect(() => {
    const filter = () => {
      if (searchQuery.trim() === '') {
        setExpenseHeads(inital);
      } else {
        const filtered = inital.filter(e =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setExpenseHeads(filtered);
      }
    }
    const filterTimeout = setTimeout(() => {
      filter();
    }, 500)

    return () => clearTimeout(filterTimeout)
  }, [searchQuery]);

  const modalRef = useRef();
  const scrollModalTop = () => {
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const handleSubmit = () => {
    scrollModalTop()
    setShowEdit(false)
    setEditExpenseHead(null)
  }

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteExpenseHead, setDeleteExpenseHead] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClientSupabase();
  const handleDelete = async (expenseHeadId, expenseHeadName) => {
    if (!expenseHeadId) return;

    try {
      setOpenDelete(false);
      setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations

      const { error } = await supabase
        .from('expense_heads')
        .delete()
        .eq('id', expenseHeadId);
      if (error) {
        console.error(error.message);
        toast.error('Failed to delete expense type.');
        return;
      }

      toast.success(`Successfully deleted expense type: ${expenseHeadName}`);
      setExpenseHeads(prev => prev.filter(s => s.id !== expenseHeadId));
    } catch (error) {
        console.error("Error deleting expense type:" + error)
    } finally {
        setDeleting(false)
    }
  }
  
  return (
    <div className="space-y-6 w-full max-w-full">
      <div className='w-full flex items-center gap-4 flex-wrap'>
          <button className="primary-btn" onClick={() => setShowAdd(true)}>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Expense Type
              </span>
          </button>
      </div>

      <div className='w-full flex flex-col gap-4'>
        <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto border-gray-300'>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
                <Input 
                  placeholder="Search expense type..."
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
            <div className='rounded-md border border-gray-300'>
              <Table>
                <TableHeader>
                  <TableRow className='border-gray-300'>
                    <TableHead>Sr.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseHeads.length === 0 ? (
                    <TableRow className='border-gray-300'>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No expense types yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseHeadsToDisplay.map((e, index) => (
                      <TableRow key={e.id} className='border-gray-300'>
                        <TableCell>{((pageNo-1) * pageSize)+(index + 1)}</TableCell>
                        <TableCell>
                          <div className='flex items-start'>
                            <h4>{e.name}</h4>
                            {e.is_salary_head && (
                              <div className="ml-1 px-1 rounded bg-gray-200 h-1/2 text-[10px] font-medium">Staff Salary</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <button className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200'
                              onClick={() => {
                                if (profile.role !== 'admin') {
                                  toast.error('Sorry, you do not have access to this feature.')
                                  return
                                }
                                setEditExpenseHead(e); setShowEdit(true);}}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className='p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200'
                              onClick={() => {
                                if (profile.role !== 'admin') {
                                  toast.error('Sorry, you do not have access to this feature.')
                                  return
                                }
                                setDeleteExpenseHead(e); setOpenDelete(true)}}
                            >
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
            <div className='w-full flex justify-between items-center mt-2 px-2'>
              <p className='text-gray-700 text-sm'>Showing page {pageNo} of {totalPages === 0 ? 1 : totalPages}</p>

              <div className='flex items-center gap-4'>
                <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === 1} onClick={() => {setPageNo(prev => prev - 1)}}>
                  <ArrowLeft className='w-4 h-4' />
                </button>
                
                <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === totalPages || expenseHeads.length === 0} onClick={() => setPageNo(prev => prev + 1)} >
                  <ArrowRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {deleteExpenseHead && (
        <ConfirmModal
          isOpen={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={() => handleDelete(deleteExpenseHead.id, deleteExpenseHead.name)}
          action="Delete"
            message={
              <>
                Are you sure you want to delete the expense type <strong>{deleteExpenseHead.name}</strong>? This action cannot be undone.
              </>
            }
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense Type" ref={modalRef}>
        <AddExpenseHeadForm
          profile={profile}
          expenseHeads={expenseHeads}
          onSubmit={handleSubmit}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditExpenseHead(null); }} title="Edit Expense Type">
        {editExpenseHead && (
        <EditExpenseHeadForm 
          expenseHead={editExpenseHead}
          expenseHeads={expenseHeads}
          onSubmit={handleSubmit}
          onCancel={() => { setShowEdit(false); setEditExpenseHead(null); }} />
        )}
      </Modal>
    </div>        
  )
}