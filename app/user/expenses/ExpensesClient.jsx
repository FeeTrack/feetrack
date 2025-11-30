'use client';
import React, { useState, useEffect, useRef, useActionState } from 'react';
import toast from "react-hot-toast";

import { createClientSupabase } from '@/utils/supabase/client';
import { filterExpensesAction } from './actions';

import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import AddExpenseForm from './AddExpenseForm';
import EditExpenseForm from './EditExpenseForm';
import Spinner from '@/components/Spinner';
import { useSession } from '@/Context/SessionContext';

import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Download, Edit, Trash2, Filter, ArrowLeft, ArrowRight } from "lucide-react";

export default function ExpensesClient({profile, expenseTypes: ets, staff: stf, recentExpenses}) {
  const [expenses, setExpenses] = useState(recentExpenses ?? []);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [hasFilteredExpenses, setHasFilteredExpenses] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState(ets ?? [])
  const [staff, setStaff] = useState(stf ?? [])
  const [editExpense, setEditExpense] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const [pageNo, setPageNo] = useState(1);
  const pageSize = 10;
  const count = expenses.length || 0;
  const totalPages = Math.ceil(count/pageSize)

  const expensesToDisplay = expenses.slice(
    (pageNo - 1) * pageSize, pageNo * pageSize
  )

  const [state, filterAction, pending] = useActionState(filterExpensesAction, { error: null});

  const [filterFormData, setFilterFormData] = useState({
      from_date: '',
      to_date: '',
      expenseType: ''
  });

  const handleFilterChange = (e) => {
      setFilterFormData({
          ...filterFormData,
          [e.target.name]: e.target.value
      })
  }

  const { currentSession }  = useSession();

  useEffect(() => {
    if (hasFilteredExpenses) return;
    setExpenses(recentExpenses ?? [])
  }, [recentExpenses])

  useEffect(() => {
    setExpenseTypes(ets ?? [])
  }, [ets])
  
  useEffect(() => {
    setStaff(stf ?? [])
  }, [stf])

  useEffect(() => {
    const sourceData = hasFilteredExpenses ? filteredExpenses : recentExpenses;
    const filter = () => {
      if (searchQuery.trim() === '') {
        setExpenses(sourceData);
      } else {
        const filtered = sourceData.filter(e =>
          e.expense_heads.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setExpenses(filtered);
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
    setEditExpense(null)
  }

  useEffect(() => {
    if (state.filteredExpensesResponse) {
      setHasFilteredExpenses(true);
      setFilteredExpenses(state.filteredExpensesResponse);
      setExpenses(state.filteredExpensesResponse);
    } else if (state.error) {
      console.error(state.error);
      toast.error('Failed to filter expenses.');
      return;
    }
  }, [state]);

  const clearFilters = () => {
    setFilterFormData({
      from_date: '',
      to_date: '',
      expenseType: ''
    });
    setHasFilteredExpenses(false);
    setExpenses(recentExpenses);
  }

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClientSupabase();
  const handleDelete = async (expenseId, expenseName) => {
    if (!expenseId) return;

    try {
        setOpenDelete(false);
        setTimeout(() => setDeleting(true), 200); // Delay showing spinner to avoid flicker for fast operations

        const is_salary_head = deleteExpense.expense_heads.is_salary_head;
        if (is_salary_head) {
          const {error} = await supabase
            .from('salary_expenses')
            .delete()
            .eq('expense_id', expenseId);
          if (error) {
            console.error(error.message);
            toast.error('Failed to delete salary expense.');
            return;
          }
          console.log('kkkkk')
        }
        const {error} = await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseId);
        if (error) {
          console.error(error.message)
          toast.error('Failed to delete expense.')
          return
        }
        
        toast.success(`Successfully deleted the expense.`);
        setExpenses(prev => prev.filter(s => s.id !== expenseId));
    } catch (error) {
        console.error("Error deleting expense type:" + error)
    } finally {
        setDeleting(false)
    }
  }
  
  return (
    <div className="space-y-6 w-full max-w-full">
      <div className='flex flex-col'>
        <div className='w-full flex items-center gap-4 flex-wrap'>
            <button className="primary-btn" onClick={() => setShowAdd(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Record Expense
                </span>
            </button>

            {profile.role === 'admin' && (
              <button type="button" className="primary-btn flex items-center gap-2" onClick={() => setShowFilter(prev => !prev)}>
                  <Filter className="w-4 h-4" />
                  Filter Expenses
              </button>
            )}
        </div>

        <div className={`w-full overflow-hidden ${showFilter ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'} transition-all duration-300`}>
          <form action={filterAction} className="flex items-center gap-4 flex-wrap" id="filterForm">
            <div className="flex flex-col gap-2">
              <label htmlFor="from_date" className="font-semibold">From</label>
              <input type="date" name="from_date" className="border rounded px-2 py-1 max-w-fit hover:border hover:border-secondary" value={filterFormData.from_date} onChange={handleFilterChange} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="to_date" className="font-semibold">To</label>
              <input type="date" name="to_date" className="border rounded px-2 py-1 max-w-fit hover:border hover:border-secondary" value={filterFormData.to_date} onChange={handleFilterChange} min={filterFormData.from_date} max={currentSession?.end_date} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor='expenseType' className='font-semibold'>Expense Type</label>
              <select name='expenseType' className="border rounded px-2 py-1 md:min-w-[100px] max-w-fit hover:border hover:border-secondary" value={filterFormData.expenseType} onChange={handleFilterChange}>
                <option value='' className='text-black'>Select Type</option>
                {expenseTypes.map(et => (
                  <option key={et.id} value={et.id} className='text-black '>
                    {et.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="primary-btn ml-2" form="filterForm" disabled={!filterFormData.from_date || !filterFormData.to_date}>Filter</button>
            
            {state?.filteredPaymentsResponse && <button type="button" className="primary-btn" onClick={clearFilters} disabled={pending}>Clear</button>}

            {pending && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
                    <Spinner size={28} />
                </div>
            )}
        </form>
        </div>

      </div>

      <div className='w-full flex flex-col gap-4'>
        <h1 className="text-lg font-semibold">{ hasFilteredExpenses ? 'Search Results' : 'Recent Expenses'}</h1>

        <Card className='w-full max-w-[calc(100vw-32px)] overflow-x-auto border-gray-300'>
          <CardHeader>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              {hasFilteredExpenses && (
                  <div>
                      <CardDescription>
                          {expenses.length} expense{expenses.length !== 1 ? 's' : ''} found.
                      </CardDescription>
                  </div>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 2-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full max-w-64 text-sm"
                  />
                </div>
                <Button variant='outline' size='icon'>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border border-gray-300'>
              <Table>
                <TableHeader>
                  <TableRow className='border-gray-300'>
                    <TableHead>Sr.</TableHead>
                    <TableHead>Expense Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expense Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow className='border-gray-300'>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No expenses yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expensesToDisplay.map((e, index) => (
                      <TableRow key={e.id} className='border-gray-300'>
                        <TableCell>{((pageNo-1) * pageSize)+(index + 1)}</TableCell>
                        <TableCell>
                          <div className='flex items-start'>
                            <h4>{e.expense_heads.name}</h4>
                            {e.expense_heads.is_salary_head && (
                              <>
                                  <h6 className="mx-1 h6x-1 rounded bg-gray-200 h-1/2 text-[10px] font-medium">Staff Salary</h6>
                                  <h4>- {e.salary_expenses[0].staff.name.split(' ')[0]}</h4>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{e.amount}</TableCell>
                        <TableCell>{new Date(e.expense_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className='max-w-24 overflow-hidden text-ellipsis whitespace-nowrap'>{e.description}</TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <button className='p-1 rounded hover:bg-secondary hover:text-secondary-foreground transition-all duration-200' onClick={() => {setEditExpense(e); setShowEdit(true);}}>
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className='p-1 rounded hover:bg-red-400 hover:text-secondary-foreground transition-all duration-200' onClick={() => {setDeleteExpense(e); setOpenDelete(true)}}>
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
                
                <button className='p-1 bg-gray-200 rounded-md disabled:bg-transparent' disabled={pageNo === totalPages || expenses.length === 0} onClick={() => setPageNo(prev => prev + 1)} >
                  <ArrowRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {deleteExpense && (
        <ConfirmModal
          isOpen={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={() => handleDelete(deleteExpense.id, deleteExpense.name)}
          action="Delete"
            message={
              <>
                Are you sure you want to delete the expense <strong>{`${deleteExpense.expense_heads.name} ${deleteExpense.expense_heads.is_salary_head && `- ${deleteExpense.salary_expenses[0].staff.name.split(' ')[0]}`}`}</strong>? This action cannot be undone.
              </>
            }
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 transition-all duration-200">
          <Spinner size={28} />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Record Expense" ref={modalRef}>
        <AddExpenseForm
          profile={profile}
          expenseTypes={expenseTypes}
          staff={staff}
          currentSession={currentSession}
          onSubmit={handleSubmit}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditExpense(null); }} title="Edit Expense Type">
        {editExpense && (
        <EditExpenseForm
          profile={profile}
          expense={editExpense}
          expenseTypes={expenseTypes}
          staff={staff}
          currentSession={currentSession}
          onSubmit={handleSubmit}
          onCancel={() => { setShowEdit(false); setEditExpense(null); }} />
        )}
      </Modal>
    </div>        
  )
}